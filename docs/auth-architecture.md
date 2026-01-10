# Hybrid Auth + Wallet Architecture (Supabase + Panna SDK)

## Goals
- Web2-style onboarding (email/social) with automatic wallet provisioning.
- Preserve on-chain role logic (admin/exporter/investor) while leveraging Supabase for profile & RLS.
- Minimize friction: one action -> authenticated session + usable wallet address.

## Components
1. Supabase Auth (magic link / OTP) for primary identity & database access.
2. Panna SDK for wallet provisioning & signing (custodial or abstracted).
3. `user_wallets` table linking Supabase `auth.users` to wallet addresses.
4. Unified Provider exposing `{ session, user, walletAddress, role, status }`.

## Flow
1. User submits email.
2. `supabase.auth.signInWithOtp({ email })` sends magic link.
3. User clicks link, returns with valid Supabase session.
4. Provider detects new session, initializes Panna SDK → obtains / creates wallet address.
5. Wallet address persisted in `user_wallets` (upsert).
6. Role resolved via existing `exporters` / `investors` tables (+ admin env list).
7. UI redirects based on role or prompts onboarding.

## Tables
### `user_wallets`
```sql
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null unique,
  primary_wallet boolean default true,
  created_at timestamptz default now()
);
create unique index if not exists user_wallets_user_primary_idx on public.user_wallets(user_id) where primary_wallet;
```

## Provider Events
- `onAuth` (Supabase session established)
- `onWalletReady` (Panna returns address)
- `onRoleResolved` (role computed)

## Fallback
If Panna SDK fails: show warning banner and allow MetaMask connect (reuse current `usePanna`).

## Security Notes
- Ensure Panna key custody model documented (MPC/HSM).
- Avoid caching session longer than Supabase expires.
- Enforce unique wallet per user; if multiple supported later, mark one primary.

## Next Steps
1. Add migration file for `user_wallets`.
2. Implement `lib/panna.ts` stub interface.
3. Refactor providers into `sdk-provider`.
4. Replace login form with email submit + status states.
5. Remove placeholder email-only logic post integration.
