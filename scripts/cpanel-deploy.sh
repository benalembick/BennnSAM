#!/usr/bin/env bash
set -euo pipefail

git pull --ff-only origin main
npm ci
npm run build

echo "Built BennnSam successfully."
echo "Copy apps/web/dist/* to public_html, then restart the cPanel Node.js app for apps/api."
