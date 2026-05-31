using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BennnSAM.Agent.Models;

namespace BennnSAM.Agent.Services;

public sealed class CryptoQueue
{
    private readonly AgentPaths _paths;
    private readonly AgentLogger _logger;

    public CryptoQueue(AgentPaths paths, AgentLogger logger)
    {
        _paths = paths;
        _logger = logger;
    }

    public QueueEnvelope Enqueue(InventoryPayload payload)
    {
        var key = LoadOrCreateKey();
        var json = JsonSerializer.Serialize(payload, AgentJsonContext.Default.InventoryPayload);
        var plaintext = Encoding.UTF8.GetBytes(json);
        var envelope = new QueueEnvelope
        {
            DeviceId = payload.DeviceId,
            DeviceFingerprint = payload.DeviceFingerprint,
            Nonce = RandomNumberGenerator.GetBytes(12),
            Ciphertext = new byte[plaintext.Length],
            Tag = new byte[16]
        };

        using var aes = new AesGcm(key);
        aes.Encrypt(envelope.Nonce, plaintext, envelope.Ciphertext, envelope.Tag);

        var path = GetEnvelopePath(envelope.Id);
        var encoded = JsonSerializer.Serialize(envelope, AgentJsonContext.Default.QueueEnvelope);
        File.WriteAllText(path, encoded);
        _logger.Info($"Queued encrypted payload {envelope.Id}");
        return envelope;
    }

    public IEnumerable<(QueueEnvelope Envelope, string Path)> GetQueued(int maxAgeDays)
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-Math.Max(1, maxAgeDays));
        foreach (var path in Directory.EnumerateFiles(_paths.Queue, "*.json"))
        {
            QueueEnvelope? envelope = null;
            try
            {
                envelope = JsonSerializer.Deserialize(File.ReadAllText(path), AgentJsonContext.Default.QueueEnvelope);
                if (envelope is null || envelope.CreatedAtUtc < cutoff)
                {
                    File.Delete(path);
                    continue;
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, $"Unable to read queue file {Path.GetFileName(path)}");
            }

            if (envelope is not null)
            {
                yield return (envelope, path);
            }
        }
    }

    public byte[] Decrypt(QueueEnvelope envelope)
    {
        var plaintext = new byte[envelope.Ciphertext.Length];
        using var aes = new AesGcm(LoadOrCreateKey());
        aes.Decrypt(envelope.Nonce, envelope.Ciphertext, envelope.Tag, plaintext);
        return plaintext;
    }

    public void Remove(string path)
    {
        File.Delete(path);
    }

    private string GetEnvelopePath(string id) => Path.Combine(_paths.Queue, $"{id}.json");

    private byte[] LoadOrCreateKey()
    {
        if (File.Exists(_paths.KeyFile))
        {
            var protectedBytes = File.ReadAllBytes(_paths.KeyFile);
            return ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser);
        }

        var key = RandomNumberGenerator.GetBytes(32);
        var encrypted = ProtectedData.Protect(key, null, DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_paths.KeyFile, encrypted);
        return key;
    }
}
