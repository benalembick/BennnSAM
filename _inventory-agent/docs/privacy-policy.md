# Privacy and Data Handling

The BennnSAM Agent collects device inventory needed for software asset management, licensing visibility, and compliance reporting.

## Data Collected

- Device identity: hostname, OS version, build, BIOS serial, hashed device fingerprint.
- Hardware: CPU, RAM, disk totals, GPU, network adapters, USB device names, monitor details.
- Software: installed applications, versions, vendors, install dates, Windows updates, browser extensions, running process metadata.
- Licensing and compliance: Windows/Office license indicators, antivirus products, firewall status, Defender status, BitLocker status, proxy/VPN indicators.

## Data Not Collected

- User documents, browser history, passwords, keystrokes, screenshots, clipboard contents, email contents, or arbitrary file contents.
- Plaintext credentials. API keys are read from the environment and redacted from logs.

## Local Storage

Queued inventory is encrypted with AES-256-GCM. The encryption key is protected with Windows DPAPI for the current user. Logs are written to `%LOCALAPPDATA%\BennnSAM\Logs` and are rotated.

## User Controls

- Run `agent.exe preview` to inspect collected data before upload.
- Use `agent-config.json` to disable modules or exclude applications, publishers, and process paths.
- Run `agent.exe uninstall` to remove startup registration and delete local BennnSAM data.

## Retention

Local logs are retained for 30 days by default. Offline queue entries older than 7 days are removed by default.
