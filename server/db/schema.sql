begin;

create extension if not exists pgcrypto;

create table if not exists roles (
  id uuid primary key,
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key,
  code text unique not null,
  label text not null
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists staff_users (
  id uuid primary key,
  full_name text not null,
  pin_salt text not null,
  pin_hash text not null,
  role_id uuid references roles(id),
  is_active boolean not null default true,
  is_root boolean not null default false,
  ui_language text not null default 'fr',
  ui_theme text not null default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_role on staff_users(role_id);

create table if not exists catalog_items (
  id uuid primary key,
  sku text unique,
  item_type text not null,
  name text not null,
  category text not null,
  description text,
  price_amount integer not null,
  cost_amount integer,
  track_stock boolean not null default false,
  stock_qty integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_category on catalog_items(category);
create index if not exists idx_catalog_active on catalog_items(is_active);

create table if not exists inventory_movements (
  id uuid primary key,
  item_id uuid not null references catalog_items(id),
  delta integer not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_inv_item on inventory_movements(item_id);
create index if not exists idx_inv_created_at on inventory_movements(created_at);

create table if not exists sales (
  id uuid primary key,
  sale_no text unique not null,
  status text not null,
  subtotal_amount integer not null,
  discount_amount integer not null default 0,
  tax_amount integer not null default 0,
  total_amount integer not null,
  paid_amount integer not null default 0,
  change_amount integer not null default 0,
  customer_name text,
  notes text,
  language text not null default 'fr',
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_created_at on sales(created_at);
create index if not exists idx_sales_status on sales(status);

create table if not exists sale_items (
  id uuid primary key,
  sale_id uuid not null references sales(id) on delete cascade,
  item_id uuid references catalog_items(id),
  item_name_snapshot text not null,
  unit_price_amount integer not null,
  qty integer not null,
  line_total_amount integer not null,
  track_stock_snapshot boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_items_sale on sale_items(sale_id);

create table if not exists sale_payments (
  id uuid primary key,
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null,
  provider text,
  reference text,
  amount integer not null,
  received_by uuid references staff_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_sale_payments_sale on sale_payments(sale_id);

create table if not exists receipts (
  id uuid primary key,
  sale_id uuid unique not null references sales(id) on delete cascade,
  receipt_no text unique not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists expense_categories (
  id uuid primary key,
  name text unique not null
);

create table if not exists expenses (
  id uuid primary key,
  category_id uuid references expense_categories(id),
  amount integer not null,
  vendor text,
  description text not null,
  paid_method text,
  paid_reference text,
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_created_at on expenses(created_at);

create table if not exists money_transfers (
  id uuid primary key,
  provider text not null,
  direction text not null,
  amount integer not null,
  fee_amount integer not null default 0,
  commission_amount integer not null default 0,
  customer_name text,
  customer_phone text,
  reference text,
  status text not null,
  language text not null default 'fr',
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_transfers_created_at on money_transfers(created_at);

create table if not exists tickets (
  id uuid primary key,
  type text not null,
  title text not null,
  description text,
  status text not null,
  priority text,
  assigned_to uuid references staff_users(id),
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_created_at on tickets(created_at);
create index if not exists idx_tickets_status on tickets(status);

create table if not exists ticket_notes (
  id uuid primary key,
  ticket_id uuid not null references tickets(id) on delete cascade,
  note text not null,
  created_by uuid references staff_users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key,
  actor_id uuid references staff_users(id),
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created_at on audit_logs(created_at);
create index if not exists idx_audit_actor on audit_logs(actor_id);

commit;
