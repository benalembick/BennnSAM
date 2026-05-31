using BennnSAM.Agent.Models;

namespace BennnSAM.Agent.Services;

public sealed class AgentLogger
{
    private readonly AgentPaths _paths;
    private readonly LoggingConfig _config;
    private readonly object _gate = new();

    public AgentLogger(AgentPaths paths, LoggingConfig config)
    {
        _paths = paths;
        _config = config;
        Rotate();
    }

    public void Info(string message) => Write("agent.log", "INFO", message);
    public void Warn(string message) => Write("agent.log", "WARN", message);
    public void Upload(string message) => Write("uploads.log", "UPLOAD", message);
    public void Error(Exception ex, string message) => Write("errors.log", "ERROR", $"{message}: {Redact(ex.Message)}");

    private void Write(string fileName, string level, string message)
    {
        var line = $"{DateTimeOffset.UtcNow:O} [{level}] {Redact(message)}{Environment.NewLine}";
        var path = Path.Combine(_paths.Logs, fileName);
        lock (_gate)
        {
            File.AppendAllText(path, line);
            var maxBytes = Math.Max(1, _config.MaxFileMb) * 1024L * 1024L;
            var info = new FileInfo(path);
            if (info.Exists && info.Length > maxBytes)
            {
                var archived = Path.Combine(_paths.Logs, $"{Path.GetFileNameWithoutExtension(fileName)}-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.log");
                File.Move(path, archived, true);
            }
        }
    }

    private void Rotate()
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-Math.Max(1, _config.RetentionDays));
        foreach (var file in Directory.EnumerateFiles(_paths.Logs, "*.log"))
        {
            try
            {
                if (File.GetLastWriteTimeUtc(file) < cutoff.UtcDateTime)
                {
                    File.Delete(file);
                }
            }
            catch
            {
                // Logging cleanup must never block inventory collection.
            }
        }
    }

    private static string Redact(string value)
    {
        var apiKey = Environment.GetEnvironmentVariable("BENNSAM_API_KEY");
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            value = value.Replace(apiKey, "[REDACTED_API_KEY]", StringComparison.Ordinal);
        }

        return value;
    }
}
