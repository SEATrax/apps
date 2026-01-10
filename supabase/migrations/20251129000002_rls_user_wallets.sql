-- Enable RLS and policies for user_wallets, guarded if table not yet created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_wallets'
  ) THEN
    RAISE NOTICE 'Table public.user_wallets not found. Skipping RLS migration.';
    RETURN;
  END IF;

  -- Enable RLS
  EXECUTE 'alter table public.user_wallets enable row level security';

  -- Drop existing policies to avoid conflicts
  EXECUTE 'drop policy if exists user_wallets_select_own on public.user_wallets';
  EXECUTE 'drop policy if exists user_wallets_insert_own on public.user_wallets';
  EXECUTE 'drop policy if exists user_wallets_update_own on public.user_wallets';

  -- Allow authenticated user to select their own wallet mapping
  EXECUTE 'create policy user_wallets_select_own on public.user_wallets
    for select
    using ( auth.uid() = user_id )';

  -- Allow insert only for row where user_id matches auth user
  EXECUTE 'create policy user_wallets_insert_own on public.user_wallets
    for insert
    with check ( auth.uid() = user_id )';

  -- Allow update of existing mapping if ownership retained
  EXECUTE 'create policy user_wallets_update_own on public.user_wallets
    for update
    using ( auth.uid() = user_id )
    with check ( auth.uid() = user_id )';
END
$$;
