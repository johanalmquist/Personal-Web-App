-- JOH-12: user_profiles table, role enum, RLS, and auto-create trigger

create type user_role as enum ('admin', 'viewer');

create table user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'viewer',
  created_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

-- Users can only read their own profile
create policy "users can read own profile"
  on user_profiles
  for select
  using (auth.uid() = id);

-- Auto-create a viewer profile when a new auth user is created
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, role)
  values (new.id, 'viewer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
