using System.Text.Json;
using BennnSAM.Agent.Models;
using BennnSAM.Agent.Services;
using Microsoft.Win32;

var paths = new AgentPaths();
var config = ConfigLoader.Load(paths);
var logger = new AgentLogger(paths, config.Logging);
var identity = new DeviceIdentity();
var collector = new InventoryCollector(config, identity, logger);
var queue = new CryptoQueue(paths, logger);
var command = args.FirstOrDefault()?.ToLowerInvariant() ?? "once";
var assumeYes = args.Any(a => string.Equals(a, "--yes", StringComparison.OrdinalIgnoreCase) || string.Equals(a, "-y", StringComparison.OrdinalIgnoreCase));

try
{
    switch (command)
    {
        case "preview":
            var preview = collector.Collect();
            Console.WriteLine(JsonSerializer.Serialize(preview, AgentJsonContext.Default.InventoryPayload));
            return 0;

        case "scan":
            var scan = collector.Collect();
            queue.Enqueue(scan);
            Console.WriteLine($"Queued inventory payload for device {scan.DeviceId}.");
            return 0;

        case "upload":
            await ConfirmUploadAsync(config, assumeYes);
            Console.WriteLine(await UploadAsync(config, queue, logger));
            return 0;

        case "once":
            var payload = collector.Collect();
            queue.Enqueue(payload);
            await ConfirmUploadAsync(config, assumeYes);
            Console.WriteLine(await UploadAsync(config, queue, logger));
            return 0;

        case "install-startup":
            InstallStartup();
            Console.WriteLine("Installed current-user startup entry.");
            return 0;

        case "uninstall":
            Uninstall(paths);
            Console.WriteLine("Removed startup entry and local BennnSAM data.");
            return 0;

        case "help":
        case "--help":
        case "-h":
            PrintHelp();
            return 0;

        default:
            PrintHelp();
            return 2;
    }
}
catch (Exception ex)
{
    logger.Error(ex, $"Command '{command}' failed");
    Console.Error.WriteLine(ex.Message);
    return 1;
}

static async Task<string> UploadAsync(AgentConfig config, CryptoQueue queue, AgentLogger logger)
{
    var apiKey = Environment.GetEnvironmentVariable("BENNSAM_API_KEY") ?? "";
    var uploader = new InventoryUploader(config, queue, logger, apiKey);
    var count = await uploader.UploadQueuedAsync(CancellationToken.None);
    return $"Uploaded {count} payload(s).";
}

static Task ConfirmUploadAsync(AgentConfig config, bool assumeYes)
{
    if (!config.Upload.RequireUserConfirmation || config.Upload.AllowUploadWithoutPrompt || assumeYes)
    {
        return Task.CompletedTask;
    }

    if (Console.IsInputRedirected)
    {
        throw new InvalidOperationException("Upload requires confirmation. Re-run with --yes or set upload.allowUploadWithoutPrompt=true.");
    }

    Console.Write("Upload inventory to BennnSAM now? Type YES to continue: ");
    var answer = Console.ReadLine();
    if (!string.Equals(answer, "YES", StringComparison.Ordinal))
    {
        throw new OperationCanceledException("Upload cancelled by user.");
    }

    return Task.CompletedTask;
}

static void InstallStartup()
{
    var exe = Environment.ProcessPath ?? throw new InvalidOperationException("Unable to resolve executable path.");
    using var run = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true)
        ?? Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true);
    run.SetValue("BennnSAM Agent", $"\"{exe}\" once --yes", RegistryValueKind.String);
}

static void Uninstall(AgentPaths paths)
{
    using (var run = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true))
    {
        run?.DeleteValue("BennnSAM Agent", throwOnMissingValue: false);
    }

    if (Directory.Exists(paths.Root))
    {
        Directory.Delete(paths.Root, recursive: true);
    }
}

static void PrintHelp()
{
    Console.WriteLine("BennnSAM Agent v1.0");
    Console.WriteLine();
    Console.WriteLine("Commands:");
    Console.WriteLine("  preview              Collect and print local inventory JSON.");
    Console.WriteLine("  scan                 Collect and queue encrypted inventory locally.");
    Console.WriteLine("  upload --yes         Upload queued payloads.");
    Console.WriteLine("  once --yes           Collect, queue, and upload.");
    Console.WriteLine("  install-startup      Add current-user startup entry.");
    Console.WriteLine("  uninstall            Remove startup entry and local BennnSAM data.");
}
