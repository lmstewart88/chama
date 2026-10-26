#!/usr/bin/env bash
# Run the whole Chama demo from the CLI against CHAMA_CONTRACT_ID in .env.
# Expects a fresh pool from scripts/demo-reset.sh. Stops on any unexpected result.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then echo "No .env; run scripts/demo-reset.sh first" >&2; exit 1; fi
set -a; . ./.env; set +a
: "${CHAMA_CONTRACT_ID:?CHAMA_CONTRACT_ID missing from .env; run scripts/demo-reset.sh first}"

NETWORK=testnet
C="$CHAMA_CONTRACT_ID"
TOKEN="${USDC_CONTRACT_ID:-CCFFHHB6VMBBJWP5FWFNLTB4AUQLSTMVYTO5CN4BMU3BWACOQMLB4G6Z}"

view() { stellar contract invoke --id "$1" --source admin --network "$NETWORK" --send=no -q -- "${@:2}"; }
call() { stellar contract invoke --id "$C" --source "$1" --network "$NETWORK" -q -- "${@:2}" >/dev/null; }

usdc() { # base units -> "123.4567890"
  local v=${1//\"/}
  printf '%d.%07d' $((v / 10000000)) $((v % 10000000))
}

step() { echo; echo "== $*"; }

show_state() {
  echo "   get_state: $(view "$C" get_state)"
}

show_balances() {
  for w in "$@"; do
    echo "   $w: $(usdc "$(view "$TOKEN" balance --id "$w")") USDC"
  done
}

show_pool_balance() {
  echo "   contract: $(usdc "$(view "$TOKEN" balance --id "$C")") USDC"
}

# Run a call that must fail with Error(Contract, #code). Anything else aborts the demo.
# Not quiet: -q also hides the CLI's error, which is what we match on. Only stderr is kept.
expect_fail() {
  local code=$1 name=$2; shift 2
  local err matched
  if err=$(stellar contract invoke --id "$C" --network "$NETWORK" "$@" 2>&1 >/dev/null); then
    echo "   ✘ UNEXPECTED: call succeeded, expected $name (#$code)"
    exit 1
  fi
  if matched=$(grep -m1 "Error(Contract, #$code)" <<<"$err"); then
    echo "   ✔ EXPECTED FAILURE: $name (#$code)"
    echo "     stderr: $matched"
  else
    echo "   ✘ UNEXPECTED ERROR (expected $name #$code):"
    echo "$err" | sed 's/^/     /'
    exit 1
  fi
}

echo "Chama demo on $NETWORK"
echo "Contract: $C"
echo "Token:    $TOKEN"

step "0. Starting state"
state=$(view "$C" get_state)
echo "   get_state: $state"
if [ "$state" != '["Open","10000000000","0","0",0]' ]; then
  echo "   ✘ Pool is not fresh; run scripts/demo-reset.sh first" >&2
  exit 1
fi
show_balances amara baraka chidi

step "1. Contributions: amara 500, baraka 300, chidi 200"
for pair in amara:5000000000 baraka:3000000000 chidi:2000000000; do
  w=${pair%%:*}; a=${pair##*:}
  call "$w" contribute --from "$w" --amount "$a"
  echo "   $w contributed $(usdc "$a"); get_contribution: $(usdc "$(view "$C" get_contribution --addr "$w")")"
done
show_state
show_balances amara baraka chidi
show_pool_balance

step "2. Verifier approves milestone 0"
call verifier approve_milestone --idx 0
show_state
echo "   get_milestone(0): $(view "$C" get_milestone --idx 0)"

step "3. Recipient spends 200 to cooling_supplier from equipment"
call recipient spend --idx 0 --category equipment --to cooling_supplier --amount 2000000000
echo "   ✔ spend succeeded"
echo "   equipment spent: $(usdc "$(view "$C" get_spent --idx 0 --category equipment)"), remaining: $(usdc "$(view "$C" get_remaining --idx 0 --category equipment)")"
show_balances cooling_supplier
show_pool_balance

step "4. Recipient tries 100 more to cooling_supplier from equipment (expect CapExceeded #7)"
expect_fail 7 CapExceeded --source recipient -- \
  spend --idx 0 --category equipment --to cooling_supplier --amount 1000000000
echo "   equipment remaining: $(usdc "$(view "$C" get_remaining --idx 0 --category equipment)")"

step "5. Recipient tries 50 to stranger from equipment (expect SupplierNotApproved #12)"
echo "   stranger is_supplier: $(view "$C" is_supplier --addr stranger)"
expect_fail 12 SupplierNotApproved --source recipient -- \
  spend --idx 0 --category equipment --to stranger --amount 500000000

step "6. Verifier rejects milestone 1"
call verifier reject_milestone --idx 1
show_state
for w in amara baraka chidi; do
  echo "   $w get_refundable: $(usdc "$(view "$C" get_refundable --addr "$w")")"
done

step "7. Refunds: amara, baraka, chidi"
for w in amara baraka chidi; do
  call "$w" refund --contributor "$w"
  echo "   $w refunded; get_refundable now: $(usdc "$(view "$C" get_refundable --addr "$w")")"
done
show_state
show_balances amara baraka chidi cooling_supplier
show_pool_balance

echo
echo "Demo complete. Expected failures seen: CapExceeded (#7), SupplierNotApproved (#12)."
