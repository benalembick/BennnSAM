namespace BennnSAM.Agent.Models;

public sealed class AgentConfig
{
    public ApiConfig Api { get; set; } = new();
    public CollectionConfig Collection { get; set; } = new();
    public UploadConfig Upload { get; set; } = new();
    public LoggingConfig Logging { get; set; } = new();
}

public sealed class ApiConfig
{
    public string PrimaryEndpoint { get; set; } = "https://api.bennsam.io";
    public string BackupEndpoint { get; set; } = "https://backup-api.bennsam.io";
    public string InventoryPath { get; set; } = "/v1/agents/{deviceId}/inventory";
    public string[] CertificatePins { get; set; } = Array.Empty<string>();
    public int TimeoutSeconds { get; set; } = 60;
}

public sealed class CollectionConfig
{
    public string[] EnabledModules { get; set; } = { "system", "software" };
    public int CacheTtlHours { get; set; } = 6;
    public int MaxParallelism { get; set; } = 4;
    public string[] ExcludePublishers { get; set; } = Array.Empty<string>();
    public string[] ExcludeApplications { get; set; } = Array.Empty<string>();
    public string[] ExcludeProcessPaths { get; set; } = Array.Empty<string>();
}

public sealed class UploadConfig
{
    public int IntervalHours { get; set; } = 24;
    public int MaxQueueAgeDays { get; set; } = 7;
    public bool RequireUserConfirmation { get; set; } = true;
    public bool AllowUploadWithoutPrompt { get; set; }
}

public sealed class LoggingConfig
{
    public int RetentionDays { get; set; } = 30;
    public int MaxFileMb { get; set; } = 10;
}
