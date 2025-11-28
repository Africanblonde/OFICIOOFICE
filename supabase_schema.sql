-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUMS
create type user_role as enum ('ADMIN', 'GENERAL_MANAGER', 'MANAGER', 'WORKER');
create type request_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED');
create type location_type as enum ('CENTRAL', 'BRANCH', 'FIELD');
create type attendance_status as enum ('D', 'D/2', 'F');
create type item_type as enum ('CONSUMABLE', 'ASSET');
create type item_condition as enum ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');
create type transaction_type as enum ('SALE', 'EXPENSE');
create type payment_method as enum ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE');
create type document_type as enum ('COTACAO', 'PRO_FORMA', 'FATURA', 'FATURA_RECIBO');
create type invoice_status as enum ('RASCUNHO', 'EMITIDA', 'PAGA_PARCIAL', 'PAGA', 'CANCELADA');
create type currency_code as enum ('MZN', 'USD');

-- LOCATIONS
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type location_type not null,
  parent_id uuid references public.locations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- USERS (Profiles linked to auth.users)
create table public.users (
  id uuid references auth.users(id) primary key,
  name text not null,
  role user_role not null default 'WORKER',
  location_id uuid references public.locations(id),
  job_title text,
  default_daily_goal numeric,
  daily_rate numeric,
  half_day_rate numeric,
  absence_penalty numeric,
  bonus_per_unit numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ITEMS
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  sku text,
  category text,
  type item_type not null,
  unit text,
  price numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVENTORY (Join table)
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) not null,
  location_id uuid references public.locations(id) not null,
  quantity numeric default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(item_id, location_id)
);

-- REQUISITIONS
create table public.requisitions (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.users(id) not null,
  source_location_id uuid references public.locations(id) not null,
  target_location_id uuid references public.locations(id) not null,
  item_id uuid references public.items(id) not null,
  quantity numeric not null,
  status request_status default 'PENDING' not null,
  condition item_condition,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REQUISITION LOGS
create table public.requisition_logs (
  id uuid default uuid_generate_v4() primary key,
  requisition_id uuid references public.requisitions(id) on delete cascade not null,
  actor_id uuid references public.users(id),
  action text not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY PERFORMANCE
create table public.daily_performance (
  id uuid default uuid_generate_v4() primary key,
  worker_id uuid references public.users(id) not null,
  date date not null,
  status attendance_status not null,
  production numeric default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(worker_id, date)
);

-- CLIENTS (CRM)
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  nuit text,
  email text,
  contact text,
  address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS (POS)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  type transaction_type not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users(id) not null,
  location_id uuid references public.locations(id) not null,
  client_name text,
  client_nuit text,
  description text,
  category text,
  amount numeric not null,
  payment_method payment_method not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTION ITEMS (Cart)
create table public.transaction_items (
  id uuid default uuid_generate_v4() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  item_id uuid references public.items(id),
  name text not null,
  quantity numeric not null,
  unit_price numeric not null
);

-- INVOICES
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  numero text not null,
  tipo document_type not null,
  status invoice_status default 'RASCUNHO' not null,
  location_id uuid references public.locations(id) not null,
  
  -- Company Info Snapshot (JSONB for flexibility or columns)
  company_name text,
  company_nuit text,
  company_address text,
  company_contact text,
  
  -- Client Info Snapshot
  client_id uuid references public.clients(id),
  client_name text,
  client_nuit text,
  client_address text,
  client_contact text,
  
  currency currency_code default 'MZN',
  issue_date date not null,
  due_date date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVOICE ITEMS
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  item_id uuid references public.items(id),
  description text not null,
  quantity numeric not null,
  unit_price numeric not null,
  tax_percent numeric default 0
);

-- INVOICE PAYMENTS
create table public.invoice_payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  method payment_method not null,
  reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Basic Setup)
alter table public.locations enable row level security;
alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.inventory enable row level security;
alter table public.requisitions enable row level security;
alter table public.requisition_logs enable row level security;
alter table public.daily_performance enable row level security;
alter table public.clients enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;

-- Create a policy that allows authenticated users to view everything (for now)
-- In a real app, you'd restrict this based on role and location.

create policy "Enable read access for authenticated users" on public.locations for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.users for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.items for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.inventory for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.requisitions for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.requisition_logs for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.daily_performance for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.clients for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.transactions for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.transaction_items for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.invoices for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.invoice_items for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.invoice_payments for select using (auth.role() = 'authenticated');

-- Enable insert/update for authenticated users (simplified for initial setup)
create policy "Enable insert for authenticated users" on public.locations for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.locations for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.users for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.users for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.items for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.items for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.inventory for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.inventory for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.requisitions for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.requisitions for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.requisition_logs for insert with check (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.daily_performance for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.daily_performance for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.clients for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.clients for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.transactions for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.transactions for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.transaction_items for insert with check (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.invoices for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.invoices for update using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.invoice_items for insert with check (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users" on public.invoice_payments for insert with check (auth.role() = 'authenticated');

-- FUNCTIONS
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'WORKER');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INDEXES for better query performance
create index idx_users_location on public.users(location_id);
create index idx_users_role on public.users(role);
create index idx_inventory_item on public.inventory(item_id);
create index idx_inventory_location on public.inventory(location_id);
create index idx_requisitions_status on public.requisitions(status);
create index idx_requisitions_requester on public.requisitions(requester_id);
create index idx_requisitions_source on public.requisitions(source_location_id);
create index idx_requisitions_target on public.requisitions(target_location_id);
create index idx_requisition_logs_requisition on public.requisition_logs(requisition_id);
create index idx_daily_performance_worker on public.daily_performance(worker_id);
create index idx_daily_performance_date on public.daily_performance(date);
create index idx_transactions_location on public.transactions(location_id);
create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_date on public.transactions(date);
create index idx_transaction_items_transaction on public.transaction_items(transaction_id);
create index idx_invoices_location on public.invoices(location_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index idx_invoice_payments_invoice on public.invoice_payments(invoice_id);

-- DELETE POLICIES (for completeness)
create policy "Enable delete for authenticated users" on public.locations for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.items for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.requisitions for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.daily_performance for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.clients for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.transactions for delete using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.invoices for delete using (auth.role() = 'authenticated');

-- AUTOMATIC UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to relevant tables
create trigger set_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.inventory
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.requisitions
  for each row execute procedure public.handle_updated_at();
