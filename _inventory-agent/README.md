# BennnSAM Agent

Lightweight, non-admin Windows inventory agent for BennnSAM software asset management.

## MVP Features

- Collects system, software, hardware, licensing, and compliance inventory using user-level-safe Windows APIs.
- Enumerates installed applications from HKLM/HKCU uninstall registry keys, including 32-bit views.
- Uploads compressed JSON payloads to BennnSAM with API-key authentication and optional certificate pinning.
- Queues encrypted payloads offline using DPAPI-protected AES-GCM storage in `%LOCALAPPDATA%\BennnSAM`.
- Writes rolling redacted logs to `%LOCALAPPDATA%\BennnSAM\Logs`.
- Supports CLI commands for preview, one-shot upload, scheduled user startup registration, and cleanup.

## Quick Start

```powershell
dotnet publish .\BennnSAM.Agent.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true
$env:BENNSAM_API_KEY = "your-api-key"
.\bin\Release\net6.0-windows\win-x64\publish\agent.exe preview
.\bin\Release\net6.0-windows\win-x64\publish\agent.exe once --yes
```

Build x86 with `-r win-x86`.

Generate the API key in BennnSAM Admin. The server stores only the hashed key in Supabase and shows the full key once.

## CLI

```text
agent.exe preview              Collect and print local JSON only.
agent.exe scan                 Collect and cache encrypted inventory locally.
agent.exe upload --yes         Upload queued payloads.
agent.exe once --yes           Collect, queue, and upload.
agent.exe install-startup      Add current user Run key.
agent.exe uninstall            Remove startup entry and local BennnSAM data.
```

Configuration defaults are read from `agent-config.json` beside the executable, then `%LOCALAPPDATA%\BennnSAM\agent-config.json` if present.

## User Install

From the agent project folder after publishing:

```powershell
.\scripts\install-user.ps1 -SourceExe .\bin\Release\net6.0-windows\win-x64\publish\agent.exe -Config .\agent-config.json -ApiKey "your-api-key" -RunInitialScan
```

This installs to `%LOCALAPPDATA%\BennnSAM`, stores `BENNSAM_API_KEY` in the current user's environment, and registers the agent to run `once --yes` at user sign-in.
