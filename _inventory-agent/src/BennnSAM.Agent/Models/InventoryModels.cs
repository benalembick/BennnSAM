using System.Text.Json.Serialization;

namespace BennnSAM.Agent.Models;

public sealed class InventoryPayload
{
    public string AgentVersion { get; set; } = "1.0.0";
    public DateTimeOffset CollectedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string DeviceId { get; set; } = "";
    public string DeviceFingerprint { get; set; } = "";
    public SystemInfo System { get; set; } = new();
    public List<ApplicationInfo> InstalledApplications { get; set; } = new();
    public List<WindowsUpdateInfo> WindowsUpdates { get; set; } = new();
    public List<BrowserExtensionInfo> BrowserExtensions { get; set; } = new();
    public List<ProcessInfo> RunningProcesses { get; set; } = new();
    public HardwareInfo Hardware { get; set; } = new();
    public LicensingInfo Licensing { get; set; } = new();
    public ComplianceInfo Compliance { get; set; } = new();
}

public sealed class SystemInfo
{
    public string DeviceName { get; set; } = Environment.MachineName;
    public string OsVersion { get; set; } = "";
    public string BuildNumber { get; set; } = "";
    public string SerialNumber { get; set; } = "";
    public string CpuModel { get; set; } = "";
    public double RamGb { get; set; }
    public double DiskTotalGb { get; set; }
    public double DiskFreeGb { get; set; }
    public string BiosInfo { get; set; } = "";
    public string Motherboard { get; set; } = "";
    public string PrimaryMacAddress { get; set; } = "";
    public DateTimeOffset? LastBootTimeUtc { get; set; }
    public string SystemUptime { get; set; } = "";
}

public sealed class ApplicationInfo
{
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Vendor { get; set; } = "";
    public string InstallDate { get; set; } = "";
    public string RegistryHive { get; set; } = "";
}

public sealed class WindowsUpdateInfo
{
    public string HotFixId { get; set; } = "";
    public string Description { get; set; } = "";
    public string InstalledOn { get; set; } = "";
}

public sealed class BrowserExtensionInfo
{
    public string Browser { get; set; } = "";
    public string Profile { get; set; } = "";
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
}

public sealed class ProcessInfo
{
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Path { get; set; } = "";
    public string Publisher { get; set; } = "";
}

public sealed class HardwareInfo
{
    public List<GpuInfo> Gpus { get; set; } = new();
    public List<NetworkAdapterInfo> NetworkAdapters { get; set; } = new();
    public List<string> UsbDevices { get; set; } = new();
    public List<MonitorInfo> Monitors { get; set; } = new();
}

public sealed class GpuInfo
{
    public string Name { get; set; } = "";
    public double VramGb { get; set; }
}

public sealed class NetworkAdapterInfo
{
    public string Name { get; set; } = "";
    public string MacAddress { get; set; } = "";
    public string[] IpAddresses { get; set; } = Array.Empty<string>();
}

public sealed class MonitorInfo
{
    public string Name { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }
}

public sealed class LicensingInfo
{
    public string WindowsLicenseStatus { get; set; } = "Unknown";
    public string OfficeLicenseStatus { get; set; } = "Unknown";
    public List<string> AntivirusProducts { get; set; } = new();
    public bool ProxyDetected { get; set; }
    public bool VpnDetected { get; set; }
}

public sealed class ComplianceInfo
{
    public string FirewallStatus { get; set; } = "Unknown";
    public string WindowsDefenderStatus { get; set; } = "Unknown";
    public string EncryptionStatus { get; set; } = "Unknown";
    public string LastAntivirusUpdate { get; set; } = "Unknown";
}

public sealed class QueueEnvelope
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string DeviceId { get; set; } = "";
    public string DeviceFingerprint { get; set; } = "";
    public byte[] Ciphertext { get; set; } = Array.Empty<byte>();
    public byte[] Nonce { get; set; } = Array.Empty<byte>();
    public byte[] Tag { get; set; } = Array.Empty<byte>();
}

[JsonSerializable(typeof(AgentConfig))]
[JsonSerializable(typeof(InventoryPayload))]
[JsonSerializable(typeof(QueueEnvelope))]
public partial class AgentJsonContext : JsonSerializerContext
{
}
