#!/bin/bash

# Script to verify an exporter both on smart contract and database
# Usage: ./verify-exporter.sh <exporter-wallet-address>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <exporter-wallet-address>"
    echo "Example: $0 0x532280Cb1663d370D38733e0E0c0D382fd6C981d"
    exit 1
fi

EXPORTER_ADDRESS="$1"

echo "🚀 Verifying exporter: $EXPORTER_ADDRESS"
echo ""

# Load environment variables
source .env.local

# Step 1: Grant role on smart contract
echo "📋 Step 1: Granting EXPORTER_ROLE on smart contract..."
if node scripts/verify-exporter.js "$EXPORTER_ADDRESS"; then
    echo "✅ Smart contract role granted successfully"
else
    echo "❌ Failed to grant smart contract role"
    exit 1
fi

echo ""

# Step 2: Update verification status in Supabase
echo "📋 Step 2: Updating verification status in database..."

# Create a temporary SQL file
cat > /tmp/update_verification.sql << EOF
UPDATE exporters 
SET is_verified = true, updated_at = now() 
WHERE wallet_address = '$EXPORTER_ADDRESS';
EOF

# Execute the SQL update (you'll need to run this manually in Supabase dashboard)
echo "📝 Please run this SQL in your Supabase dashboard:"
echo ""
echo "UPDATE exporters"
echo "SET is_verified = true, updated_at = now()" 
echo "WHERE wallet_address = '$EXPORTER_ADDRESS';"
echo ""

echo "🎉 Verification process complete!"
echo ""
echo "📋 Summary:"
echo "   - Smart contract role: ✅ GRANTED"
echo "   - Database status: ⚠️  MANUAL UPDATE REQUIRED"
echo ""
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/yazynajjhzowyvuzrqkb"