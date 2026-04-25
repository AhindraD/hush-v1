#!/usr/bin/env bash
# scripts/deploy.sh — Build and deploy the HUSH Anchor program to devnet
set -euo pipefail

PROGRAM_ID="HUSHvau1tXGqT1nFDUzGJpyvT1CYS8yEQV8X5LmHHu1"
CLUSTER="${ANCHOR_CLUSTER:-devnet}"
WALLET="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"

echo "🔒 HUSH — Deploy Script"
echo "  Cluster : $CLUSTER"
echo "  Wallet  : $WALLET"
echo "  Program : $PROGRAM_ID"
echo ""

# ── 1. Pre-flight ──────────────────────────────────────────────────────────────
command -v anchor  >/dev/null 2>&1 || { echo "anchor-cli not found"; exit 1; }
command -v solana  >/dev/null 2>&1 || { echo "solana-cli not found"; exit 1; }

solana config set --url "$CLUSTER" --keypair "$WALLET" >/dev/null

echo "📦 Building program…"
anchor build

echo ""
echo "🚀 Deploying to $CLUSTER…"
anchor deploy --provider.cluster "$CLUSTER"

echo ""
echo "✅ Deploy complete."
echo "   Program ID : $PROGRAM_ID"
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm --filter @hush/server db:seed' to seed demo data"
echo "  2. Run 'pnpm dev' to start the full stack"
