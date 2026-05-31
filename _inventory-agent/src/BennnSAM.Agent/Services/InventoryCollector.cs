using System.Diagnostics;
using System.Management;
using System.Net.NetworkInformation;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using BennnSAM.Agent.Models;
using Microsoft.Win32;

namespace BennnSAM.Agent.Services;

public sealed class InventoryCollector
{
    private readonly AgentConfig _config;
    private readonly DeviceIdentity _identity;
    private readonly AgentLogger _logger;

    public InventoryCollector(AgentConfig config, DeviceIdentity identity, AgentLogger logger)
    {
        _config = config;
        _identity = identity;
        _logger = logger;
    }

    public InventoryPayload Collect()
    {
        var payload = new InventoryPayload
        {
            DeviceId = _identity.DeviceId,
            DeviceFingerprint = _identity.Fingerprint
        };

        var modules = _config.Collection.EnabledModules.Select(m => m.ToLowerInvariant()).ToHashSet();
        var tasks = new List<Action>();
        if (modules.Contains("system")) tasks.Add(() => payload.System = CollectSystemInfo());
        if (modules.Contains("software")) tasks.Add(() =>
        {
            payload.InstalledApplications = CollectInstalledApplications();
            payload.WindowsUpdates = CollectWindowsUpdates();
            payload.BrowserExtensions = CollectBrowserExtensions();
            payload.RunningProcesses = CollectProcesses();
        });
        if (modules.Contains("hardware")) tasks.Add(() => payload.Hardware = CollectHardware());
        if (modules.Contains("licensing")) tasks.Add(() => payload.Licensing = CollectLicensing());
        if (modules.Contains("compliance")) tasks.Add(() => payload.Compliance = CollectCompliance());

        Parallel.ForEach(tasks, new ParallelOptions { MaxDegreeOfParallelism = Math.Clamp(_config.Collection.MaxParallelism, 1, 4) }, task =>
        {
            try
            {
                task();
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Collection module failed");
            }
        });

        return payload;
    }

    private static SystemInfo CollectSystemInfo()
    {
        var os = Wmi.Query("SELECT Caption, Version, BuildNumber, LastBootUpTime FROM Win32_OperatingSystem").FirstOrDefault();
        var cpu = Wmi.FirstValue("Win32_Processor", "Name");
        var bios = Wmi.Query("SELECT Manufacturer, SMBIOSBIOSVersion, SerialNumber FROM Win32_BIOS").FirstOrDefault();
        var board = Wmi.Query("SELECT Manufacturer, Product FROM Win32_BaseBoard").FirstOrDefault();
        var cs = Wmi.Query("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem").FirstOrDefault();
        var drive = DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady && d.Name.Equals(Path.GetPathRoot(Environment.SystemDirectory), StringComparison.OrdinalIgnoreCase));
        var lastBoot = ParseWmiDate(os.Get("LastBootUpTime"));

        return new SystemInfo
        {
            DeviceName = Environment.MachineName,
            OsVersion = $"{os.Get("Caption")} {os.Get("Version")}".Trim(),
            BuildNumber = os.Get("BuildNumber"),
            SerialNumber = bios.Get("SerialNumber"),
            CpuModel = cpu,
            RamGb = ToGb(cs.Get("TotalPhysicalMemory")),
            DiskTotalGb = drive is null ? 0 : BytesToGb(drive.TotalSize),
            DiskFreeGb = drive is null ? 0 : BytesToGb(drive.AvailableFreeSpace),
            BiosInfo = $"{bios.Get("Manufacturer")} {bios.Get("SMBIOSBIOSVersion")}".Trim(),
            Motherboard = $"{board.Get("Manufacturer")} {board.Get("Product")}".Trim(),
            PrimaryMacAddress = NetworkInterface.GetAllNetworkInterfaces().FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up)?.GetPhysicalAddress().ToString() ?? "",
            LastBootTimeUtc = lastBoot,
            SystemUptime = lastBoot is null ? "" : (DateTimeOffset.UtcNow - lastBoot.Value).ToString("c")
        };
    }

    private List<ApplicationInfo> CollectInstalledApplications()
    {
        var apps = new List<ApplicationInfo>();
        ReadUninstallKey(apps, RegistryHive.LocalMachine, RegistryView.Registry64, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
        ReadUninstallKey(apps, RegistryHive.LocalMachine, RegistryView.Registry32, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
        ReadUninstallKey(apps, RegistryHive.CurrentUser, RegistryView.Default, @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");

        return apps
            .Where(a => !IsExcluded(a.Name, _config.Collection.ExcludeApplications))
            .Where(a => !IsExcluded(a.Vendor, _config.Collection.ExcludePublishers))
            .GroupBy(a => $"{a.Name}|{a.Version}|{a.Vendor}", StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .OrderBy(a => a.Name)
            .ToList();
    }

    private static void ReadUninstallKey(List<ApplicationInfo> apps, RegistryHive hive, RegistryView view, string keyPath)
    {
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(hive, view);
            using var key = baseKey.OpenSubKey(keyPath, false);
            if (key is null) return;

            foreach (var subName in key.GetSubKeyNames())
            {
                using var sub = key.OpenSubKey(subName, false);
                var name = sub?.GetValue("DisplayName")?.ToString();
                if (string.IsNullOrWhiteSpace(name)) continue;

                apps.Add(new ApplicationInfo
                {
                    Name = name.Trim(),
                    Version = sub?.GetValue("DisplayVersion")?.ToString() ?? "",
                    Vendor = sub?.GetValue("Publisher")?.ToString() ?? "",
                    InstallDate = sub?.GetValue("InstallDate")?.ToString() ?? "",
                    RegistryHive = $"{hive}/{view}"
                });
            }
        }
        catch
        {
        }
    }

    private static List<WindowsUpdateInfo> CollectWindowsUpdates()
    {
        return SafeWmi("SELECT HotFixID, Description, InstalledOn FROM Win32_QuickFixEngineering")
            .Select(r => new WindowsUpdateInfo
            {
                HotFixId = r.Get("HotFixID"),
                Description = r.Get("Description"),
                InstalledOn = r.Get("InstalledOn")
            })
            .ToList();
    }

    private static List<BrowserExtensionInfo> CollectBrowserExtensions()
    {
        var result = new List<BrowserExtensionInfo>();
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var roaming = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        ReadChromiumExtensions(result, "Chrome", Path.Combine(local, "Google", "Chrome", "User Data"));
        ReadChromiumExtensions(result, "Edge", Path.Combine(local, "Microsoft", "Edge", "User Data"));
        ReadFirefoxExtensions(result, Path.Combine(roaming, "Mozilla", "Firefox", "Profiles"));
        return result;
    }

    private static void ReadChromiumExtensions(List<BrowserExtensionInfo> result, string browser, string userDataRoot)
    {
        if (!Directory.Exists(userDataRoot)) return;
        foreach (var profile in Directory.EnumerateDirectories(userDataRoot).Where(d => Directory.Exists(Path.Combine(d, "Extensions"))))
        {
            var extRoot = Path.Combine(profile, "Extensions");
            foreach (var ext in Directory.EnumerateDirectories(extRoot))
            {
                foreach (var versionDir in Directory.EnumerateDirectories(ext).OrderByDescending(Path.GetFileName).Take(1))
                {
                    var manifest = Path.Combine(versionDir, "manifest.json");
                    if (!File.Exists(manifest)) continue;
                    try
                    {
                        using var doc = JsonDocument.Parse(File.ReadAllText(manifest));
                        result.Add(new BrowserExtensionInfo
                        {
                            Browser = browser,
                            Profile = Path.GetFileName(profile),
                            Id = Path.GetFileName(ext),
                            Name = doc.RootElement.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                            Version = doc.RootElement.TryGetProperty("version", out var v) ? v.GetString() ?? "" : ""
                        });
                    }
                    catch
                    {
                    }
                }
            }
        }
    }

    private static void ReadFirefoxExtensions(List<BrowserExtensionInfo> result, string profilesRoot)
    {
        if (!Directory.Exists(profilesRoot)) return;
        foreach (var profile in Directory.EnumerateDirectories(profilesRoot))
        {
            var extensionsJson = Path.Combine(profile, "extensions.json");
            if (!File.Exists(extensionsJson)) continue;
            try
            {
                using var doc = JsonDocument.Parse(File.ReadAllText(extensionsJson));
                if (!doc.RootElement.TryGetProperty("addons", out var addons)) continue;
                foreach (var addon in addons.EnumerateArray())
                {
                    result.Add(new BrowserExtensionInfo
                    {
                        Browser = "Firefox",
                        Profile = Path.GetFileName(profile),
                        Id = addon.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                        Name = addon.TryGetProperty("defaultLocale", out var locale) && locale.TryGetProperty("name", out var name) ? name.GetString() ?? "" : "",
                        Version = addon.TryGetProperty("version", out var version) ? version.GetString() ?? "" : ""
                    });
                }
            }
            catch
            {
            }
        }
    }

    private List<ProcessInfo> CollectProcesses()
    {
        return Process.GetProcesses()
            .Select(ReadProcess)
            .Where(p => p is not null)
            .Cast<ProcessInfo>()
            .Where(p => !IsExcluded(p.Path, _config.Collection.ExcludeProcessPaths))
            .OrderBy(p => p.Name)
            .ToList();
    }

    private static ProcessInfo? ReadProcess(Process process)
    {
        try
        {
            var path = process.MainModule?.FileName ?? "";
            return new ProcessInfo
            {
                Name = process.ProcessName,
                Path = path,
                Version = string.IsNullOrWhiteSpace(path) ? "" : FileVersionInfo.GetVersionInfo(path).ProductVersion ?? "",
                Publisher = GetPublisher(path)
            };
        }
        catch
        {
            return null;
        }
    }

    private static string GetPublisher(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path)) return "";
        try
        {
            using var cert = new X509Certificate2(X509Certificate.CreateFromSignedFile(path));
            return cert.Subject;
        }
        catch
        {
            return "";
        }
    }

    private static HardwareInfo CollectHardware()
    {
        var hardware = new HardwareInfo();
        hardware.Gpus = SafeWmi("SELECT Name, AdapterRAM FROM Win32_VideoController")
            .Select(r => new GpuInfo { Name = r.Get("Name"), VramGb = ToGb(r.Get("AdapterRAM")) })
            .ToList();
        hardware.NetworkAdapters = NetworkInterface.GetAllNetworkInterfaces()
            .Where(n => n.NetworkInterfaceType != NetworkInterfaceType.Loopback)
            .Select(n => new NetworkAdapterInfo
            {
                Name = n.Name,
                MacAddress = n.GetPhysicalAddress().ToString(),
                IpAddresses = n.GetIPProperties().UnicastAddresses.Select(a => a.Address.ToString()).ToArray()
            })
            .ToList();
        hardware.UsbDevices = SafeWmi("SELECT Name FROM Win32_PnPEntity WHERE PNPClass = 'USB'")
            .Select(r => r.Get("Name"))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
        hardware.Monitors = SafeWmi("SELECT Name, ScreenWidth, ScreenHeight FROM Win32_DesktopMonitor")
            .Select(r => new MonitorInfo { Name = r.Get("Name"), Width = ToInt(r.Get("ScreenWidth")), Height = ToInt(r.Get("ScreenHeight")) })
            .ToList();
        return hardware;
    }

    private static LicensingInfo CollectLicensing()
    {
        var windowsLicense = SafeWmi("SELECT LicenseStatus FROM SoftwareLicensingProduct WHERE PartialProductKey IS NOT NULL")
            .Select(r => LicenseStatus(r.Get("LicenseStatus")))
            .FirstOrDefault(s => s != "Unknown") ?? "Unknown";
        var antivirus = SafeWmi(@"SELECT displayName, productState, timestamp FROM root\SecurityCenter2:AntiVirusProduct")
            .Select(r => r.Get("displayName"))
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new LicensingInfo
        {
            WindowsLicenseStatus = windowsLicense,
            OfficeLicenseStatus = DetectOfficeLicense(),
            AntivirusProducts = antivirus,
            ProxyDetected = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Internet Settings")?.GetValue("ProxyEnable")?.ToString() == "1",
            VpnDetected = NetworkInterface.GetAllNetworkInterfaces().Any(n => n.Description.Contains("vpn", StringComparison.OrdinalIgnoreCase) || n.Name.Contains("vpn", StringComparison.OrdinalIgnoreCase))
        };
    }

    private static ComplianceInfo CollectCompliance()
    {
        var firewallProducts = SafeWmi(@"SELECT displayName FROM root\SecurityCenter2:FirewallProduct").Select(r => r.Get("displayName")).ToList();
        var defender = ReadDefenderStatus();
        return new ComplianceInfo
        {
            FirewallStatus = firewallProducts.Count > 0 ? $"Detected: {string.Join(", ", firewallProducts)}" : "Unknown",
            WindowsDefenderStatus = defender.Status,
            EncryptionStatus = ReadBitLockerStatus(),
            LastAntivirusUpdate = defender.LastUpdate
        };
    }

    private static string DetectOfficeLicense()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Office\ClickToRun\Configuration", false);
            var productIds = key?.GetValue("ProductReleaseIds")?.ToString();
            return string.IsNullOrWhiteSpace(productIds) ? "Unknown" : $"Installed: {productIds}";
        }
        catch
        {
            return "Unknown";
        }
    }

    private static (string Status, string LastUpdate) ReadDefenderStatus()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows Defender\Signature Updates", false);
            var update = key?.GetValue("SignatureUpdateTime")?.ToString() ?? "Unknown";
            return ("Detected", update);
        }
        catch
        {
            return ("Unknown", "Unknown");
        }
    }

    private static string ReadBitLockerStatus()
    {
        try
        {
            var windowsDrive = Path.GetPathRoot(Environment.SystemDirectory)?.TrimEnd('\\') ?? "C:";
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "manage-bde.exe",
                Arguments = $"-status {windowsDrive}",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                CreateNoWindow = true
            });
            var output = process?.StandardOutput.ReadToEnd() ?? "";
            process?.WaitForExit(3000);
            var line = output.Split(Environment.NewLine).FirstOrDefault(l => l.Contains("Conversion Status", StringComparison.OrdinalIgnoreCase));
            return string.IsNullOrWhiteSpace(line) ? "Unknown" : line.Trim();
        }
        catch
        {
            return "Unknown";
        }
    }

    private static IEnumerable<Dictionary<string, string>> SafeWmi(string query)
    {
        try
        {
            return Wmi.Query(query).ToList();
        }
        catch
        {
            return Enumerable.Empty<Dictionary<string, string>>();
        }
    }

    private static DateTimeOffset? ParseWmiDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try
        {
            return ManagementDateTimeConverter.ToDateTime(value).ToUniversalTime();
        }
        catch
        {
            return null;
        }
    }

    private static bool IsExcluded(string value, IEnumerable<string> exclusions) =>
        !string.IsNullOrWhiteSpace(value) && exclusions.Any(e => !string.IsNullOrWhiteSpace(e) && value.Contains(e, StringComparison.OrdinalIgnoreCase));

    private static double ToGb(string value) => double.TryParse(value, out var bytes) ? BytesToGb(bytes) : 0;
    private static double BytesToGb(double bytes) => Math.Round(bytes / 1024d / 1024d / 1024d, 2);
    private static int ToInt(string value) => int.TryParse(value, out var result) ? result : 0;
    private static string LicenseStatus(string value) => value switch
    {
        "1" => "Licensed",
        "2" => "Out-of-box grace",
        "3" => "Out-of-tolerance grace",
        "4" => "Non-genuine grace",
        "5" => "Notification",
        "6" => "Extended grace",
        _ => "Unknown"
    };
}

internal static class DictionaryExtensions
{
    public static string Get(this Dictionary<string, string>? row, string key) =>
        row is not null && row.TryGetValue(key, out var value) ? value : "";
}
