param(
    [string]$SourceExe = ".\agent.exe",
    [string]$Config = ".\agent-config.json",
    [string]$ApiKey = "",
    [switch]$RunInitialScan
)

$ErrorActionPreference = "Stop"

$installRoot = Join-Path $env:LOCALAPPDATA "BennnSAM"
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null

Copy-Item -LiteralPath $SourceExe -Destination (Join-Path $installRoot "agent.exe") -Force
if (Test-Path -LiteralPath $Config) {
    Copy-Item -LiteralPath $Config -Destination (Join-Path $installRoot "agent-config.json") -Force
}

if ($ApiKey) {
    [Environment]::SetEnvironmentVariable("BENNSAM_API_KEY", $ApiKey, "User")
    $env:BENNSAM_API_KEY = $ApiKey
} elseif (-not $env:BENNSAM_API_KEY) {
    Write-Warning "BENNSAM_API_KEY is not set. Uploads will fail until the user environment variable is configured."
}

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Set-ItemProperty -Path $runKey -Name "BennnSAM Agent" -Value "`"$installRoot\agent.exe`" once --yes"

if ($RunInitialScan) {
    & (Join-Path $installRoot "agent.exe") once --yes
}

Write-Host "BennnSAM Agent installed for current user at $installRoot"
