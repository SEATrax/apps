#!/bin/bash
# Script untuk cek data Supabase via CLI

echo "🔍 Checking Supabase Database..."
echo ""

echo "📧 Auth Users:"
npx supabase db execute --db-url "postgresql://postgres:mxtztqz35H6k6az2@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  "SELECT email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "💼 User Wallets:"
npx supabase db execute --db-url "postgresql://postgres:mxtztqz35H6k6az2@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  "SELECT wallet_address, created_at FROM public.user_wallets ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "🏢 Exporters:"
npx supabase db execute --db-url "postgresql://postgres:mxtztqz35H6k6az2@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  "SELECT company_name, wallet_address, is_verified FROM public.exporters ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "💰 Investors:"
npx supabase db execute --db-url "postgresql://postgres:mxtztqz35H6k6az2@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" \
  "SELECT name, wallet_address FROM public.investors ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "✅ Done!"
