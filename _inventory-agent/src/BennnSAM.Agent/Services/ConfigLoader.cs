using System.Text.Json;
using BennnSAM.Agent.Models;

namespace BennnSAM.Agent.Services;

public static class ConfigLoader
{
    public static AgentConfig Load(AgentPaths paths)
    {
        var exeConfig = Path.Combine(AppContext.BaseDirectory, "agent-config.json");
        var selected = File.Exists(paths.LocalConfig) ? paths.LocalConfig : exeConfig;
        if (!File.Exists(selected))
        {
            return new AgentConfig();
        }

        var json = File.ReadAllText(selected);
        return JsonSerializer.Deserialize(json, AgentJsonContext.Default.AgentConfig) ?? new AgentConfig();
    }
}
