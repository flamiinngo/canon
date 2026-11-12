#!/usr/bin/env bash
# One-shot setup: creates the two faucet-funded testnet accounts (if missing),
# then deploys Canon, seeds the demo story and writes LEDGER.md.
#
#   bash scripts/setup-all.sh [registry-name] [funder-name]
# Defaults: canon-bootstate.testnet and canon-bootstate-demo.testnet
set -uo pipefail
REGISTRY="${1:-canon-bootstate.testnet}"
FUNDER="${2:-canon-bootstate-demo.testnet}"
HERE="$(cd "$(dirname "$0")" && pwd)"

exists() {
  curl -s -m 20 -X POST https://test.rpc.fastnear.com -H 'content-type: application/json'     -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"query\",\"params\":{\"request_type\":\"view_account\",\"finality\":\"final\",\"account_id\":\"$1\"}}" | grep -q '"amount"'
}

for acc in "$REGISTRY" "$FUNDER"; do
  if exists "$acc"; then
    echo "✓ $acc already exists"
  else
    echo "▸ Creating $acc with the testnet faucet"
    near account create-account sponsor-by-faucet-service "$acc" autogenerate-new-keypair save-to-legacy-keychain network-config testnet create
    sleep 3
    exists "$acc" || { echo "✗ Could not create $acc (name taken or faucet busy). Re-run with another name: bash scripts/setup-all.sh <name>.testnet <name>-demo.testnet"; exit 1; }
  fi
done

exec bash "$HERE/deploy.sh" "$REGISTRY" "$FUNDER"
