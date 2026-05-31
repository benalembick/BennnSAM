namespace BennnSAM.Agent.Services;

public sealed class AgentPaths
{
    public AgentPaths()
    {
        var local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        Root = Path.Combine(local, "BennnSAM");
        Logs = Path.Combine(Root, "Logs");
        Queue = Path.Combine(Root, "Queue");
        Cache = Path.Combine(Root, "Cache");
        KeyFile = Path.Combine(Root, "cache.key");
        LocalConfig = Path.Combine(Root, "agent-config.json");

        Directory.CreateDirectory(Root);
        Directory.CreateDirectory(Logs);
        Directory.CreateDirectory(Queue);
        Directory.CreateDirectory(Cache);
    }

    public string Root { get; }
    public string Logs { get; }
    public string Queue { get; }
    public string Cache { get; }
    public string KeyFile { get; }
    public string LocalConfig { get; }
}
