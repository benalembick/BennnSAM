# Deployment Guide

## Build

Install the .NET 6 SDK on a build machine, then publish single-file binaries:

```powershell
dotnet restore .\BennnSAM.Agent.csproj
dotnet publish .\BennnSAM.Agent.csproj -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true -o .\publish\win-x64
dotnet publish .\BennnSAM.Agent.csproj -c Release -r win-x86 --self-contained true /p:PublishSingleFile=true -o .\publish\win-x86
```

Outputs are portable `agent.exe` files. Sign each executable before distribution.

## No-Admin User Install

```powershell
.\scripts\install-user.ps1 -SourceExe .\publish\win-x64\agent.exe -Config .\agent-config.json -ApiKey "tenant-api-key" -RunInitialScan
```

The installer copies files to `%LOCALAPPDATA%\BennnSAM`, stores `BENNSAM_API_KEY` in the current user's environment, and registers a current-user startup entry at:

```text
HKCU\Software\Microsoft\Windows\CurrentVersion\Run\BennnSAM Agent
```

## Portable Use

```powershell
$env:BENNSAM_API_KEY = "tenant-api-key"
.\agent.exe preview
.\agent.exe once --yes
```

## Enterprise Deployment

- Group Policy logon script: run `scripts/install-user.ps1 -ApiKey "tenant-api-key"`.
- Intune/SCCM user-context deployment: copy `agent.exe` and `agent-config.json`, set the user or machine `BENNSAM_API_KEY`, then run `agent.exe install-startup`.
- Air-gapped systems: run `agent.exe scan`; encrypted queue files remain in `%LOCALAPPDATA%\BennnSAM\Queue` until upload is possible.

## Scheduled Operation

The MVP startup mode runs once at user login. For stricter daily scheduling, create a user-level scheduled task:

```powershell
$exe = "$env:LOCALAPPDATA\BennnSAM\agent.exe"
$action = New-ScheduledTaskAction -Execute $exe -Argument "once --yes"
$trigger = New-ScheduledTaskTrigger -Daily -At 10am
Register-ScheduledTask -TaskName "BennnSAM Agent" -Action $action -Trigger $trigger -Description "BennnSAM inventory upload" -Force
```

## Uninstall

```powershell
%LOCALAPPDATA%\BennnSAM\agent.exe uninstall
```

This removes the current-user startup entry and deletes local logs, cache, queue, and configuration.
It also removes `BENNSAM_API_KEY` from the current user's environment.
