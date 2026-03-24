-- JOH-16: RLS policies for Finance module tables
-- SELECT: any authenticated user
-- INSERT / UPDATE / DELETE: admin role only (defence-in-depth; primary enforcement is in the Hono API)

-- Helper: admin check
-- exists (select 1 from user_profiles where id = auth.uid() and role = 'admin')

-- ─── budget_categories ────────────────────────────────────────────────────────

create policy "budget_categories_select" on budget_categories
  for select to authenticated using (true);

create policy "budget_categories_insert" on budget_categories
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "budget_categories_update" on budget_categories
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "budget_categories_delete" on budget_categories
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── master_budget_items ──────────────────────────────────────────────────────

create policy "master_budget_items_select" on master_budget_items
  for select to authenticated using (true);

create policy "master_budget_items_insert" on master_budget_items
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "master_budget_items_update" on master_budget_items
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "master_budget_items_delete" on master_budget_items
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── master_budget_settings ───────────────────────────────────────────────────

create policy "master_budget_settings_select" on master_budget_settings
  for select to authenticated using (true);

create policy "master_budget_settings_insert" on master_budget_settings
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "master_budget_settings_update" on master_budget_settings
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "master_budget_settings_delete" on master_budget_settings
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── monthly_budgets ──────────────────────────────────────────────────────────

create policy "monthly_budgets_select" on monthly_budgets
  for select to authenticated using (true);

create policy "monthly_budgets_insert" on monthly_budgets
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "monthly_budgets_update" on monthly_budgets
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "monthly_budgets_delete" on monthly_budgets
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── monthly_budget_items ─────────────────────────────────────────────────────

create policy "monthly_budget_items_select" on monthly_budget_items
  for select to authenticated using (true);

create policy "monthly_budget_items_insert" on monthly_budget_items
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "monthly_budget_items_update" on monthly_budget_items
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "monthly_budget_items_delete" on monthly_budget_items
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── tags ─────────────────────────────────────────────────────────────────────

create policy "tags_select" on tags
  for select to authenticated using (true);

create policy "tags_insert" on tags
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "tags_update" on tags
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "tags_delete" on tags
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── transactions ─────────────────────────────────────────────────────────────

create policy "transactions_select" on transactions
  for select to authenticated using (true);

create policy "transactions_insert" on transactions
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "transactions_update" on transactions
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "transactions_delete" on transactions
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── transaction_tags ────────────────────────────────────────────────────────

create policy "transaction_tags_select" on transaction_tags
  for select to authenticated using (true);

create policy "transaction_tags_insert" on transaction_tags
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "transaction_tags_delete" on transaction_tags
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- ─── pre_registered_entries ──────────────────────────────────────────────────

create policy "pre_registered_entries_select" on pre_registered_entries
  for select to authenticated using (true);

create policy "pre_registered_entries_insert" on pre_registered_entries
  for insert to authenticated
  with check (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "pre_registered_entries_update" on pre_registered_entries
  for update to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

create policy "pre_registered_entries_delete" on pre_registered_entries
  for delete to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));
