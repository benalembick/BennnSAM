# BennnSAM Agent API

## Authentication

Set the API key in the agent process environment:

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
- `409`: duplicate payload.
- `429`: rate limited; agent will retry later.
- `5xx`: transient server error; agent retries and keeps the encrypted queue.
