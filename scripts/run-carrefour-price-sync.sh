#!/bin/bash

# Wrapper para programar desde cron/systemd/GitHub Actions.
# Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"
python3 scripts/scraping-carrefour.py
