-- JOH-15: Finance & Budget module tables

-- Enums
create type budget_status as enum ('open', 'closed');
create type transaction_type as enum ('income', 'expense');

-- updated_at trigger function (shared)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- budget_categories
create table budget_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- master_budget_items
create table master_budget_items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references budget_categories(id) on delete cascade,
  name           text not null,
  default_amount numeric not null default 0,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger master_budget_items_updated_at
  before update on master_budget_items
  for each row execute procedure update_updated_at();

-- master_budget_settings (single-row table)
create table master_budget_settings (
  id             uuid primary key default gen_random_uuid(),
  monthly_income numeric not null default 0,
  updated_at     timestamptz not null default now()
);

create trigger master_budget_settings_updated_at
  before update on master_budget_settings
  for each row execute procedure update_updated_at();

-- monthly_budgets
create table monthly_budgets (
  id         uuid primary key default gen_random_uuid(),
  year       int not null,
  month      int not null check (month between 1 and 12),
  status     budget_status not null default 'open',
  income     numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (year, month)
);

-- monthly_budget_items (snapshot of master at budget creation time)
create table monthly_budget_items (
  id                uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid not null references monthly_budgets(id) on delete cascade,
  master_item_id    uuid references master_budget_items(id) on delete set null,
  category_name     text not null,
  item_name         text not null,
  budgeted_amount   numeric not null default 0,
  created_at        timestamptz not null default now()
);

-- tags
create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- transactions
create table transactions (
  id                uuid primary key default gen_random_uuid(),
  monthly_budget_id uuid not null references monthly_budgets(id) on delete cascade,
  date              date not null,
  description       text not null,
  type              transaction_type not null,
  amount            numeric not null,
  monthly_item_id   uuid references monthly_budget_items(id) on delete set null,
  attachment_path   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger transactions_updated_at
  before update on transactions
  for each row execute procedure update_updated_at();

-- transaction_tags (many-to-many)
create table transaction_tags (
  transaction_id uuid not null references transactions(id) on delete cascade,
  tag_id         uuid not null references tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- pre_registered_entries
create table pre_registered_entries (
  id          uuid primary key default gen_random_uuid(),
  year        int not null,
  month       int not null check (month between 1 and 12),
  description text not null,
  type        transaction_type not null,
  amount      numeric not null,
  category_id uuid references budget_categories(id) on delete set null,
  tag_id      uuid references tags(id) on delete set null,
  imported    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Enable RLS on all finance tables (policies defined in JOH-16)
alter table budget_categories enable row level security;
alter table master_budget_items enable row level security;
alter table master_budget_settings enable row level security;
alter table monthly_budgets enable row level security;
alter table monthly_budget_items enable row level security;
alter table tags enable row level security;
alter table transactions enable row level security;
alter table transaction_tags enable row level security;
alter table pre_registered_entries enable row level security;
