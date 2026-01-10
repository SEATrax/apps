-- Migration: Add user_wallets table for hybrid auth wallet linkage
-- Ensure pgcrypto for gen_random_uuid (local dev safety)
create extension if not exists pgcrypto;

create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null unique,
  primary_wallet boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists user_wallets_user_primary_idx on public.user_wallets(user_id) where primary_wallet;
