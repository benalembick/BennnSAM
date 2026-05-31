using System.Management;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;

namespace BennnSAM.Agent.Services;

public sealed class DeviceIdentity
{
    public string DeviceId { get; }
    public string Fingerprint { get; }

    public DeviceIdentity()
    {
        var machineGuid = ReadMachineGuid();
        var serial = Wmi.FirstValue("Win32_BIOS", "SerialNumber");
        var mac = NetworkInterface.GetAllNetworkInterfaces()
            .Where(n => n.OperationalStatus == OperationalStatus.Up)
            .Select(n => n.GetPhysicalAddress().ToString())
            .FirstOrDefault(s => !string.IsNullOrWhiteSpace(s)) ?? "";

        Fingerprint = Sha256($"{Environment.MachineName}|{machineGuid}|{serial}|{mac}");
        DeviceId = Fingerprint[..16];
    }

    private static string ReadMachineGuid()
    {
        try
        {
            using var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography", false);
            return key?.GetValue("MachineGuid")?.ToString() ?? "";
        }
        catch
        {
            return "";
        }
    }

    private static string Sha256(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

public static class Wmi
{
    public static string FirstValue(string className, string property)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher($"SELECT {property} FROM {className}");
            foreach (ManagementObject item in searcher.Get())
            {
                return item[property]?.ToString()?.Trim() ?? "";
            }
        }
        catch
        {
        }

        return "";
    }

    public static IEnumerable<Dictionary<string, string>> Query(string query)
    {
        var scope = new ManagementScope(@"\\.\root\cimv2");
        var actualQuery = query;
        const string fromRoot = " FROM root\\";
        var fromRootIndex = query.IndexOf(fromRoot, StringComparison.OrdinalIgnoreCase);
        if (fromRootIndex >= 0)
        {
            var namespaceStart = fromRootIndex + " FROM ".Length;
            var colonIndex = query.IndexOf(':', namespaceStart);
            if (colonIndex > namespaceStart)
            {
                var namespaceName = query[namespaceStart..colonIndex];
                var className = query[(colonIndex + 1)..];
                scope = new ManagementScope($@"\\.\{namespaceName}");
                actualQuery = $"{query[..fromRootIndex]} FROM {className}";
            }
        }
        else
        {
            var selectIndex = query.IndexOf("SELECT", StringComparison.OrdinalIgnoreCase);
            if (selectIndex > 0 && query[selectIndex - 1] == ':')
            {
                var namespaceName = query[..(selectIndex - 1)];
                scope = new ManagementScope($@"\\.\{namespaceName}");
                actualQuery = query[selectIndex..];
            }
        }

        using var searcher = new ManagementObjectSearcher(scope, new ObjectQuery(actualQuery));
        foreach (ManagementObject item in searcher.Get())
        {
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (PropertyData property in item.Properties)
            {
                row[property.Name] = property.Value?.ToString() ?? "";
            }

            yield return row;
        }
    }
}
