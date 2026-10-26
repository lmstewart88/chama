#!/usr/bin/env bash
# Deploy a fresh Chama pool for the demo and put the demo wallets back to their starting state.
# Safe to run repeatedly: each run deploys a new contract, tops up or trims balances to exact
# amounts, and replaces CHAMA_CONTRACT_ID in .env. Testnet only. Reads no secret keys itself;
# signing uses the `stellar keys` identities.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then set -a; . ./.env; set +a; fi

NETWORK=testnet
TOKEN="${USDC_CONTRACT_ID:-CCFFHHB6VMBBJWP5FWFNLTB4AUQLSTMVYTO5CN4BMU3BWACOQMLB4G6Z}"
WASM=target/wasm32v1-none/release/chama_pool.wasm
GOAL=10000000000            # 1,000 USDC
EQUIPMENT_CAP=2500000000    # 250 USDC
INSTALLATION_CAP=1500000000 # 150 USDC

addr() { stellar keys address "$1"; }
view() { stellar contract invoke --id "$1" --source admin --network "$NETWORK" --send=no -q -- "${@:2}"; }
call() { stellar contract invoke --id "$1" --source "$2" --network "$NETWORK" -q -- "${@:3}" >/dev/null; }

echo "== Building contract"
stellar contract build >/dev/null
echo "   $WASM"

echo "== Deploying fresh contract (token $TOKEN)"
CHAMA_CONTRACT_ID=$(stellar contract deploy --wasm "$WASM" --source admin --network "$NETWORK" -q -- \
  --admin "$(addr admin)" \
  --verifier "$(addr verifier)" \
  --recipient "$(addr recipient)" \
  --token "$TOKEN" \
  --goal "$GOAL" \
  --milestones_bps '[4000,3000,3000]')
echo "   $CHAMA_CONTRACT_ID"

echo "== Setting contributor balances"
# Mint the shortfall, or send any excess back to the issuer (admin), which burns it.
for pair in amara:5000000000 baraka:3000000000 chidi:2000000000; do
  w=${pair%%:*}
  target=${pair##*:}
  current=$(view "$TOKEN" balance --id "$w" | tr -d '"')
  diff=$((target - current))
  if [ "$diff" -gt 0 ]; then
    call "$TOKEN" admin mint --to "$w" --amount "$diff"
  elif [ "$diff" -lt 0 ]; then
    call "$TOKEN" "$w" transfer --from "$w" --to "$(addr admin)" --amount "$((-diff))"
  fi
  echo "   $w: $(view "$TOKEN" balance --id "$w" | tr -d '"') (was $current)"
done

echo "== Registering suppliers"
for s in cooling_supplier installer; do
  call "$CHAMA_CONTRACT_ID" admin add_supplier --supplier "$s"
  echo "   $s is_supplier: $(view "$CHAMA_CONTRACT_ID" is_supplier --addr "$s")"
done

echo "== Setting caps on milestone 0"
call "$CHAMA_CONTRACT_ID" admin set_caps --idx 0 \
  --caps "[[\"equipment\",\"$EQUIPMENT_CAP\"],[\"installation\",\"$INSTALLATION_CAP\"]]"
echo "   equipment: $(view "$CHAMA_CONTRACT_ID" get_cap --idx 0 --category equipment)"
echo "   installation: $(view "$CHAMA_CONTRACT_ID" get_cap --idx 0 --category installation)"

echo "== Writing CHAMA_CONTRACT_ID, VITE_CHAMA_CONTRACT_ID and VITE_TOKEN_CONTRACT_ID to .env"
# Vite only exposes VITE_-prefixed variables to the web app.
touch .env
tmp=$(mktemp)
grep -v -e '^CHAMA_CONTRACT_ID=' -e '^VITE_CHAMA_CONTRACT_ID=' -e '^VITE_TOKEN_CONTRACT_ID=' .env >"$tmp" || true
echo "CHAMA_CONTRACT_ID=$CHAMA_CONTRACT_ID" >>"$tmp"
echo "VITE_CHAMA_CONTRACT_ID=$CHAMA_CONTRACT_ID" >>"$tmp"
echo "VITE_TOKEN_CONTRACT_ID=$TOKEN" >>"$tmp"
mv "$tmp" .env

echo
echo "New CHAMA_CONTRACT_ID: $CHAMA_CONTRACT_ID"
