using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Security;
using System.Security.Authentication;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using BennnSAM.Agent.Models;

namespace BennnSAM.Agent.Services;

public sealed class InventoryUploader
{
    private readonly AgentConfig _config;
    private readonly CryptoQueue _queue;
    private readonly AgentLogger _logger;
    private readonly string _apiKey;

    public InventoryUploader(AgentConfig config, CryptoQueue queue, AgentLogger logger, string apiKey)
    {
        _config = config;
        _queue = queue;
        _logger = logger;
        _apiKey = apiKey;
    }

    public async Task<int> UploadQueuedAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException("BENNSAM_API_KEY is not set.");
        }

        var uploaded = 0;
        foreach (var (envelope, path) in _queue.GetQueued(_config.Upload.MaxQueueAgeDays))
        {
            var plaintext = _queue.Decrypt(envelope);
            var compressed = Compress(plaintext);
            var success = await UploadWithRetriesAsync(envelope, compressed, cancellationToken);
            if (success)
            {
                _queue.Remove(path);
                uploaded++;
                _logger.Upload($"Uploaded payload {envelope.Id}");
            }
        }

        return uploaded;
    }

    private async Task<bool> UploadWithRetriesAsync(QueueEnvelope envelope, byte[] compressed, CancellationToken cancellationToken)
    {
        var endpoints = new[] { _config.Api.PrimaryEndpoint, _config.Api.BackupEndpoint }
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        foreach (var endpoint in endpoints)
        {
            for (var attempt = 1; attempt <= 3; attempt++)
            {
                try
                {
                    using var client = CreateClient();
                    var url = BuildUrl(endpoint, envelope.DeviceId);
                    using var request = new HttpRequestMessage(HttpMethod.Post, url);
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                    request.Headers.Add("X-Device-Fingerprint", envelope.DeviceFingerprint);
                    request.Content = new ByteArrayContent(compressed);
                    request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    request.Content.Headers.ContentEncoding.Add("gzip");

                    using var response = await client.SendAsync(request, cancellationToken);
                    if (response.IsSuccessStatusCode)
                    {
                        return true;
                    }

                    _logger.Warn($"Upload failed ({(int)response.StatusCode}) to {endpoint}, attempt {attempt}");
                }
                catch (Exception ex) when (attempt < 3)
                {
                    _logger.Error(ex, $"Upload exception to {endpoint}, attempt {attempt}");
                }

                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt) * 30), cancellationToken);
            }
        }

        return false;
    }

    private HttpClient CreateClient()
    {
        var handler = new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.None,
            SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
            ServerCertificateCustomValidationCallback = ValidateServerCertificate
        };

        return new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(Math.Clamp(_config.Api.TimeoutSeconds, 5, 300))
        };
    }

    private bool ValidateServerCertificate(HttpRequestMessage request, X509Certificate2? certificate, X509Chain? chain, SslPolicyErrors errors)
    {
        if (errors != SslPolicyErrors.None || certificate is null)
        {
            return false;
        }

        if (_config.Api.CertificatePins.Length == 0)
        {
            return true;
        }

        var hash = Convert.ToBase64String(SHA256.HashData(certificate.RawData));
        return _config.Api.CertificatePins.Any(pin => string.Equals(pin, hash, StringComparison.Ordinal));
    }

    private string BuildUrl(string endpoint, string deviceId)
    {
        var path = _config.Api.InventoryPath.Replace("{deviceId}", Uri.EscapeDataString(deviceId), StringComparison.OrdinalIgnoreCase);
        return $"{endpoint.TrimEnd('/')}/{path.TrimStart('/')}";
    }

    private static byte[] Compress(byte[] input)
    {
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal, leaveOpen: true))
        {
            gzip.Write(input, 0, input.Length);
        }

        return output.ToArray();
    }
}
