# BennnSAM Agent API

## Authentication

Generate the agent API key in BennnSAM Admin. The API stores only a SHA-256 hash and a short display prefix in Supabase. Set the generated key in the agent process or user environment:

```text
BENNSAM_API_KEY=...
```

The agent sends:

```http
Authorization: Bearer {api-key}
X-Device-Fingerprint: {sha256-device-fingerprint}
Content-Encoding: gzip
Content-Type: application/json
```

## Inventory Upload

```http
POST https://api.bennsam.io/v1/agents/{device-id}/inventory
```

The body is a gzip-compressed JSON inventory payload. Local queued payloads are AES-256-GCM encrypted before disk storage, then decrypted and compressed for transport.

The BennnSAM API also accepts the same authenticated payload at `/api/agent/upload` for compatibility with the existing dashboard and demo tooling.

## Certificate Pinning

`api.certificatePins` accepts base64 SHA-256 hashes of the server certificate raw DER bytes. Leave empty during development; set one primary and one backup pin in production.

Example pin generation:

```powershell
$tcp = [Net.Sockets.TcpClient]::new("api.bennsam.io", 443)
$ssl = [Net.Security.SslStream]::new($tcp.GetStream(), $false, ({ $true }))
$ssl.AuthenticateAsClient("api.bennsam.io")
[Convert]::ToBase64String([Security.Cryptography.SHA256]::HashData($ssl.RemoteCertificate.GetRawCertData()))
```

## Response Codes

- `200` or `202`: accepted.
- `400`: invalid payload.
- `401` or `403`: invalid API key or tenant access.
- `503`: BennnSAM API has no agent API key configured.
- `409`: duplicate payload.
- `429`: rate limited; agent will retry later.
- `5xx`: transient server error; agent retries and keeps the encrypted queue.
