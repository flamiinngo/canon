#!/usr/bin/env bash
# Canon: build, deploy, seed the demo lineage on NEAR testnet, record every
# transaction (including refused attacks) in JUDGES.md, then lock the registry.
#
# Usage (Linux / macOS / WSL), after creating two funded testnet accounts:
#   near account create-account sponsor-by-faucet-service <registry>.testnet autogenerate-new-keypair save-to-legacy-keychain network-config testnet create
#   near account create-account sponsor-by-faucet-service <funder>.testnet   autogenerate-new-keypair save-to-legacy-keychain network-config testnet create
#   bash scripts/deploy.sh <registry>.testnet <funder>.testnet
#
# Steps can be skipped with SKIP_BUILD=1, SKIP_DEPLOY=1, SKIP_SEED=1, SKIP_LOCK=1.
set -uo pipefail

REGISTRY="${1:?usage: deploy.sh <registry>.testnet <funder>.testnet}"
FUNDER="${2:?usage: deploy.sh <registry>.testnet <funder>.testnet}"
NET="network-config testnet"
SIGN="sign-with-legacy-keychain send"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$HOME/canon-target}"
OUT="$CARGO_TARGET_DIR/near"
LOG="$ROOT/scripts/deploy.log"
LEDGER="$ROOT/JUDGES.md"
EXPLORER="https://testnet.nearblocks.io/txns"
: > "$LOG"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }

# ── Ledger ──────────────────────────────────────────────────────────────
ROWS=()
record() { # record <step> <expected> <outcome> <hash>
  local link="—"
  [[ -n "$4" ]] && link="[\`${4:0:10}…\`]($EXPLORER/$4)"
  ROWS+=("| $1 | $2 | $3 | $link |")
}

# tx <step description> <expect: ok|ERR_CODE> <near cli args...>
tx() {
  local step="$1" expect="$2"; shift 2
  local out hash outcome
  out="$(near "$@" 2>&1)"
  echo "── $step" >> "$LOG"; echo "$out" >> "$LOG"
  hash="$(grep -oE '(Transaction ID|transaction ID|tx hash|Transaction hash)[: ]+[1-9A-HJ-NP-Za-km-z]{43,44}' <<<"$out" | grep -oE '[1-9A-HJ-NP-Za-km-z]{43,44}$' | tail -1)"
  [[ -z "$hash" ]] && hash="$(grep -oE "$EXPLORER/[1-9A-HJ-NP-Za-km-z]{43,44}|/txns/[1-9A-HJ-NP-Za-km-z]{43,44}" <<<"$out" | grep -oE '[1-9A-HJ-NP-Za-km-z]{43,44}$' | tail -1)"
  if [[ "$expect" == "ok" ]]; then
    if grep -qiE 'error|failure|panicked' <<<"$out"; then outcome="❌ unexpected failure"; else outcome="✅ succeeded"; fi
  else
    if grep -q "$expect" <<<"$out"; then outcome="🛡️ refused: \`$expect\`"; else outcome="❌ expected $expect"; fi
  fi
  echo "   $outcome ${hash:+($hash)}"
  record "$step" "$expect" "$outcome" "$hash"
}

# txc <step> <expect> <signer> <method> <json> <deposit> [gas]
txc() {
  local step="$1" expect="$2" signer="$3" method="$4" json="$5" deposit="$6" gas="${7:-150 Tgas}"
  tx "$step" "$expect" contract call-function as-transaction "$REGISTRY" "$method" json-args "$json"     prepaid-gas "$gas" attached-deposit "$deposit" sign-as "$signer" network-config testnet sign-with-legacy-keychain send
}

near_view() {
  near contract call-function as-read-only "$REGISTRY" "$1" json-args "${2:-{\}}" $NET now 2>&1
}

# ── 1. Build ────────────────────────────────────────────────────────────
if [[ -z "${SKIP_BUILD:-}" ]]; then
  say "Building contracts"
  (cd "$ROOT/contracts" && cargo test -p canon-registry --quiet) || { echo "tests failed"; exit 1; }
  # The vault is no_std with no near-sdk, so it targets the pre-84 wasm feature set (Rust 1.86).
  rustup toolchain list | grep -q '^1.86.0' || rustup toolchain install 1.86.0 --profile minimal --target wasm32-unknown-unknown
  (cd "$ROOT/contracts/vault" && RUSTUP_TOOLCHAIN=1.86.0 cargo near build non-reproducible-wasm --no-abi) || exit 1
  (cd "$ROOT/contracts/registry" && cargo near build non-reproducible-wasm) || exit 1
fi
VAULT_WASM="$OUT/canon_vault/canon_vault.wasm"
REGISTRY_WASM="$OUT/canon_registry/canon_registry.wasm"
[[ -f "$VAULT_WASM" && -f "$REGISTRY_WASM" ]] || { echo "wasm not found in $OUT; run without SKIP_BUILD"; exit 1; }
echo "vault:    $VAULT_WASM ($(stat -c%s "$VAULT_WASM") bytes)"
echo "registry: $REGISTRY_WASM ($(stat -c%s "$REGISTRY_WASM") bytes)"
VAULT_HASH="$(python3 -c '
import hashlib,sys
a="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
d=hashlib.sha256(open(sys.argv[1],"rb").read()).digest(); n=int.from_bytes(d,"big"); s=""
while n: n,r=divmod(n,58); s=a[r]+s
print("1"*(len(d)-len(d.lstrip(b"\0")))+s)' "$VAULT_WASM")"
echo "vault code hash: $VAULT_HASH"

# ── 2. Deploy ───────────────────────────────────────────────────────────
if [[ -z "${SKIP_DEPLOY:-}" ]]; then
  say "Publishing the vault as an immutable global contract (by hash)"
  tx "Publish vault code as NEP-591 global contract \`$VAULT_HASH\`" ok \
    contract deploy-as-global use-file "$VAULT_WASM" as-global-hash "$FUNDER" $NET $SIGN
  say "Deploying the registry"
  tx "Deploy registry to \`$REGISTRY\` and initialise with the vault hash" ok \
    contract deploy "$REGISTRY" use-file "$REGISTRY_WASM" with-init-call new json-args "{\"vault_code_hash\":\"$VAULT_HASH\"}" prepaid-gas "100 Tgas" attached-deposit "0 NEAR" $NET $SIGN
fi

# ── 3. Seed the demo story ──────────────────────────────────────────────
N() { echo "$1.$FUNDER"; }
Y() { python3 -c "from decimal import Decimal as D;print(int(D('$1')*10**24))"; }
terms() { echo "{\"derivatives\":$1,\"commercial\":$2,\"upstream_bps\":$3,\"price\":\"$(Y "$4")\"}"; }
reg() { # reg <who> <id> <title> <kind> <genome media> <terms> <owner_bps> <contributors json> <parent or null> <description>
  local parent="null"; [[ "$9" != "null" ]] && parent="\"$9\""
  local json="{\"token_id\":\"$2\",\"title\":\"$3\",\"description\":\"${10}\",\"media\":\"$5?kind=$4\",\"file_hash\":\"genome:$2\",\"terms\":$6,\"owner_bps\":$7,\"contributors\":$8,\"parent_id\":$parent}"
  local what="$1 registers **$3**"
  [[ "$9" != "null" ]] && what="$what as a derivative of \`$9\`"
  txc "$what" ok "$(N "$1")" register_work "$json" "0.1 NEAR"
}

if [[ -z "${SKIP_SEED:-}" ]]; then
  say "Creating demo accounts under $FUNDER"
  for a in ada ben cy dee fay gil hal ivy jun lea max nox kai eve; do
    near account create-account fund-myself "$(N $a)" "0.35 NEAR" autogenerate-new-keypair save-to-legacy-keychain sign-as "$FUNDER" $NET $SIGN >> "$LOG" 2>&1 && echo "  $(N $a)"
  done
  near account create-account fund-myself "$(N studio)" "3 NEAR" autogenerate-new-keypair save-to-legacy-keychain sign-as "$FUNDER" $NET $SIGN >> "$LOG" 2>&1 && echo "  $(N studio)"

  say "Registering the Ember Field lineage"
  reg ada ember "Ember Field" "Original%20artwork" "canon:genome/4127/flow/ember/-" "$(terms true true 2000 0.4)" 10000 "[]" null "A generative flow field of 1,100 strokes, released for licensed derivatives."
  reg ben ember-relief "Ember Field — Relief" "3D%20relief" "canon:genome/4127/flow/ember/relief" "$(terms true true 2500 1)" 7000 "[{\"account_id\":\"$(N cy)\",\"role\":\"Materials\",\"bps\":3000}]" ember "The flow field rebuilt as sculpted relief."
  txc "ada approves Relief into canon" ok "$(N ada)" approve '{"token_id":"ember-relief"}' "1 yoctoNEAR" "30 Tgas"
  reg dee ember-motion "Ember Field — Motion" "Motion%20loop" "canon:genome/4127/flow/ember/relief+motion" "$(terms false true 0 1.5)" 8000 "[{\"account_id\":\"$(N fay)\",\"role\":\"Score\",\"bps\":2000}]" ember-relief "The relief set in motion, with an original score."
  txc "🛡️ ada (not the parent's owner) tries to approve Motion" ERR_NOT_PARENT_OWNER "$(N ada)" approve '{"token_id":"ember-motion"}' "1 yoctoNEAR" "30 Tgas"
  txc "🛡️ studio tries to license Motion before it is approved" ERR_NOT_CLEARED "$(N studio)" buy_license '{"token_id":"ember-motion","use_case":"Games & interactive"}' "1.6 NEAR"
  txc "ben approves Motion into canon" ok "$(N ben)" approve '{"token_id":"ember-motion"}' "1 yoctoNEAR" "30 Tgas"
  reg gil ember-nocturne "Ember Field — Nocturne" "Colourway" "canon:genome/4127/flow/nocturne/recolor" "$(terms true true 1000 0.3)" 10000 "[]" ember "The same field at night."
  txc "ada approves Nocturne" ok "$(N ada)" approve '{"token_id":"ember-nocturne"}' "1 yoctoNEAR" "30 Tgas"
  reg hal ember-pixel "Ember Field — Pixel" "Pixel%20edition" "canon:genome/4127/flow/ember/pixel" "$(terms true true 1000 0.25)" 10000 "[]" ember "A 48×48 pixel edition, awaiting review."

  say "Other families: non-commercial, revoked, closed"
  reg ivy moth-light "Moth Light" "Original%20artwork" "canon:genome/913/rings/violet/-" "$(terms true false 0 0)" 10000 "[]" null "Concentric orbits. Fan works welcome; commercial use reserved."
  reg jun moth-fragments "Moth Light — Fragments" "Remix" "canon:genome/913/rings/violet/fragment" "$(terms false true 0 0.2)" 10000 "[]" moth-light "A tiled remix of Moth Light."
  txc "ivy approves Fragments" ok "$(N ivy)" approve '{"token_id":"moth-fragments"}' "1 yoctoNEAR" "30 Tgas"
  txc "🛡️ studio tries to license Fragments (parent forbids commercial use)" ERR_NOT_CLEARED "$(N studio)" buy_license '{"token_id":"moth-fragments","use_case":"Brand & merchandise"}' "0.3 NEAR"
  reg lea tidal "Tidal" "Original%20artwork" "canon:genome/2203/strata/tidal/-" "$(terms true true 1500 0.6)" 8500 "[{\"account_id\":\"$(N max)\",\"role\":\"Art direction\",\"bps\":1500}]" null "Fourteen layers of sea-floor strata under a low sun."
  reg nox tidal-neon "Tidal — Neon Remix" "Remix" "canon:genome/2203/strata/neon/recolor+fragment" "$(terms false true 0 0.35)" 10000 "[]" tidal "A neon, tiled reinterpretation of Tidal."
  txc "lea approves Neon Remix" ok "$(N lea)" approve '{"token_id":"tidal-neon"}' "1 yoctoNEAR" "30 Tgas"
  txc "lea revokes Neon Remix" ok "$(N lea)" revoke '{"token_id":"tidal-neon"}' "1 yoctoNEAR" "30 Tgas"
  txc "🛡️ studio tries to license the revoked Neon Remix" ERR_NOT_CLEARED "$(N studio)" buy_license '{"token_id":"tidal-neon","use_case":"Film & motion"}' "0.5 NEAR"
  reg kai quarry "Quarry" "Original%20artwork" "canon:genome/77/strata/quarry/relief" "$(terms false true 0 0.8)" 10000 "[]" null "Cut stone in relief. Licensable as-is; derivatives closed."
  txc "🛡️ hal tries to derive from Quarry (derivatives closed)" ERR_DERIVATIVES_CLOSED "$(N hal)" register_work "{\"token_id\":\"quarry-remix\",\"title\":\"Quarry Remix\",\"description\":null,\"media\":null,\"file_hash\":\"x\",\"terms\":$(terms false true 0 0.1),\"owner_bps\":10000,\"contributors\":[],\"parent_id\":\"quarry\"}" "0.1 NEAR"
  txc "🛡️ ada registers splits totalling 90%" ERR_BAD_SPLITS "$(N ada)" register_work "{\"token_id\":\"bad-splits\",\"title\":\"Bad\",\"description\":null,\"media\":null,\"file_hash\":\"x\",\"terms\":$(terms true true 0 0.1),\"owner_bps\":9000,\"contributors\":[],\"parent_id\":null}" "0.1 NEAR"

  say "The licence: one payment, three generations"
  txc "studio licenses **Ember Field — Motion** for 1.5 Ⓝ (splits: dee vault 0.9, fay 0.225, ben vault 0.21, cy 0.09, ada vault 0.075)" ok "$(N studio)" buy_license '{"token_id":"ember-motion","use_case":"Games & interactive"}' "1.6 NEAR"
  txc "studio licenses **Quarry** for 0.8 Ⓝ" ok "$(N studio)" buy_license '{"token_id":"quarry","use_case":"Brand & merchandise"}' "0.9 NEAR"

  say "Control follows the token"
  txc "🛡️ eve (not the owner) tries to withdraw Relief's vault" ERR_NOT_OWNER "$(N eve)" withdraw '{"token_id":"ember-relief"}' "1 yoctoNEAR" "60 Tgas"
  txc "ben lists Relief on a marketplace (nft_approve)" ok "$(N ben)" nft_approve "{\"token_id\":\"ember-relief\",\"account_id\":\"$(N eve)\",\"msg\":null}" "0.01 NEAR" "30 Tgas"
  txc "🛡️ ben tries to drain Relief's vault while it is listed" ERR_TOKEN_LISTED "$(N ben)" withdraw '{"token_id":"ember-relief"}' "1 yoctoNEAR" "60 Tgas"
  txc "ben sells Relief to eve (nft_transfer)" ok "$(N ben)" nft_transfer "{\"receiver_id\":\"$(N eve)\",\"token_id\":\"ember-relief\",\"approval_id\":null,\"memo\":null}" "1 yoctoNEAR" "30 Tgas"
  txc "🛡️ ben (the seller) tries to withdraw after the sale" ERR_NOT_OWNER "$(N ben)" withdraw '{"token_id":"ember-relief"}' "1 yoctoNEAR" "60 Tgas"
  tx "🛡️ eve calls Relief's vault \`release\` directly, bypassing the registry" ERR_ONLY_REGISTRY     contract call-function as-transaction "ember-relief.$REGISTRY" release json-args '{}' prepaid-gas "30 Tgas" attached-deposit "0 NEAR" sign-as "$(N eve)" $NET $SIGN
  txc "eve (the buyer) withdraws 0.21 Ⓝ earned before she bought it" ok "$(N eve)" withdraw '{"token_id":"ember-relief"}' "1 yoctoNEAR" "60 Tgas"
  txc "cy claims 0.09 Ⓝ: her credit did not move with the sale" ok "$(N cy)" claim '{}' "0 NEAR" "30 Tgas"
  txc "dee withdraws Motion's vault (0.9 Ⓝ)" ok "$(N dee)" withdraw '{"token_id":"ember-motion"}' "1 yoctoNEAR" "60 Tgas"
  txc "fay claims her 0.225 Ⓝ score share" ok "$(N fay)" claim '{}' "0 NEAR" "30 Tgas"
  txc "🛡️ fay tries to claim twice" ERR_NOTHING_TO_CLAIM "$(N fay)" claim '{}' "0 NEAR" "30 Tgas"
fi

# ── 4. Lock the registry ────────────────────────────────────────────────
KEYS_NOTE="(skipped)"
if [[ -z "${SKIP_LOCK:-}" ]]; then
  say "Deleting the registry's access keys: no one, including us, can change it"
  for k in $(near account list-keys "$REGISTRY" $NET now 2>&1 | grep -oE 'ed25519:[1-9A-HJ-NP-Za-km-z]+'); do
    tx "Delete registry access key \`${k:0:18}…\`" ok account delete-keys "$REGISTRY" public-keys "$k" $NET $SIGN
  done
  KEYS_NOTE="$(near account list-keys "$REGISTRY" $NET now 2>&1 | tail -5)"
fi

# ── 5. Write JUDGES.md ──────────────────────────────────────────────────
{
  echo "# Canon on NEAR testnet: verifiable ledger"
  echo
  echo "Generated by \`scripts/deploy.sh\` on $(date -u +%Y-%m-%dT%H:%MZ). Every row is a real testnet transaction."
  echo "Rows marked 🛡️ are attacks; the contract refused them with the error shown."
  echo
  echo "* Registry: [\`$REGISTRY\`](https://testnet.nearblocks.io/address/$REGISTRY)"
  echo "* Vault code (NEP-591 global, by hash): \`$VAULT_HASH\`"
  echo "* Example vault: [\`ember-motion.$REGISTRY\`](https://testnet.nearblocks.io/address/ember-motion.$REGISTRY), which has no access keys"
  echo
  echo "| Step | Expected | Outcome | Transaction |"
  echo "|---|---|---|---|"
  printf '%s\n' "${ROWS[@]}"
  echo
  echo "## Verify it yourself"
  echo
  echo '```bash'
  echo "near account list-keys $REGISTRY network-config testnet now              # registry: no keys"
  echo "near account list-keys ember-motion.$REGISTRY network-config testnet now # vault: no keys"
  echo "near contract call-function as-read-only $REGISTRY clearance json-args '{\"token_id\":\"moth-fragments\"}' network-config testnet now"
  echo "near contract call-function as-read-only $REGISTRY quote_license json-args '{\"token_id\":\"ember-motion\"}' network-config testnet now"
  echo '```'
  echo
  echo "Registry keys after locking:"
  echo
  echo '```'
  echo "$KEYS_NOTE"
  echo '```'
} > "$LEDGER"

say "Done. Ledger written to JUDGES.md; full CLI output in scripts/deploy.log"
echo "Set NEXT_PUBLIC_CANON_CONTRACT=$REGISTRY in web/.env.local (and on Vercel)."
