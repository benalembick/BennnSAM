# Troubleshooting Guide

## API Key Missing

Symptom:

```text
BENNSAM_API_KEY is not set.
```

Fix:

```powershell
$env:BENNSAM_API_KEY = "your-api-key"
```

For managed deployment, set the variable in the user or machine environment before startup.

## Upload Requires Confirmation

Symptom:

```text
Upload requires confirmation.
```

Fix one of:

- Run `agent.exe once --yes`.
- Set `upload.allowUploadWithoutPrompt` to `true` in the config.
- Set `upload.requireUserConfirmation` to `false` for enterprise silent deployment.

## Certificate Pin Mismatch

Clear `api.certificatePins` for development or update pins using the production certificate hash. A mismatch blocks upload by design.

## WMI Locked Down

Some corporate baselines restrict WMI classes. The agent logs the failure and continues collecting other modules. Check:

```text
%LOCALAPPDATA%\BennnSAM\Logs\errors.log
```

## Offline Machines

Run:

```powershell
agent.exe scan
```

Encrypted queue files remain under `%LOCALAPPDATA%\BennnSAM\Queue` until `agent.exe upload --yes` succeeds.

## Build Machine Missing SDK

Install the .NET 6 SDK. Runtimes alone cannot compile or publish `agent.exe`.
