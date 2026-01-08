#!/bin/bash

# Script to apply Supabase migrations manually
# This applies the migrations to the remote Supabase instance

echo "🚀 Applying Supabase migrations..."

# Check if SUPABASE_SERVICE_KEY is set
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_KEY not set in environment"
    echo "Please set it in your .env.local file"
    exit 1
fi

echo "📋 Available migrations:"
ls -la /home/hadyan/web3/apps/supabase/migrations/

echo ""
echo "🔧 To apply these migrations manually:"
echo "1. Open Supabase Dashboard: https://yazynajjhzowyvuzrqkb.supabase.co"
echo "2. Go to SQL Editor"
echo "3. Run each migration file in order:"
echo "   - 20260108000001_create_exporters_table.sql"
echo "   - 20260108000002_create_investors_table.sql" 
echo "   - 20260108000003_create_invoice_metadata.sql"
echo "   - 20260108000004_create_pool_and_payments.sql"
echo ""
echo "✅ Migration files are ready in supabase/migrations/ folder"