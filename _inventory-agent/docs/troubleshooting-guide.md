# Troubleshooting Guide

## API Key Missing

Symptom:

```text
BENNSAM_API_KEY is not set.
```

Fix:

```powershell
[Environment]::SetEnvironmentVariable("BENNSAM_API_KEY", "your-api-key", "User")
$env:BENNSAM_API_KEY = "your-api-key"
```

For managed deployment, pass `-ApiKey` to `scripts/install-user.ps1`, or set the variable in the user or machine environment before startup.

## API Rejects Uploads

Symptom:

```text
Upload failed (401)
```

Fix:

- Confirm the key exists and is active in BennnSAM Admin.
- Confirm `supabase/migrations/003_agent_api_keys.sql` has been applied.
- Confirm the agent user's `BENNSAM_API_KEY` exactly matches the generated key shown at creation time.
- Confirm `api.primaryEndpoint` points to the BennnSAM API host, for example `https://yourdomain.com`.

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
