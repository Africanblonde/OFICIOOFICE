-- Migration: Settings Tables
-- This adds tables for payment methods, expense categories, and company settings

-- PAYMENT METHODS TABLE
create table public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPENSE CATEGORIES TABLE
create table public.expense_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMPANY SETTINGS TABLE (Single row configuration)
create table public.company_settings (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  company_nuit text not null,
  company_address text not null,
  company_contact text,
  default_currency text default 'MZN',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.users(id)
);

-- Insert default payment methods
insert into public.payment_methods (name) values
  ('Dinheiro'),
  ('Cartão'),
  ('M-Pesa'),
  ('e-Mola'),
  ('Transferência Bancária'),
  ('Cheque');

-- Insert default expense categories
insert into public.expense_categories (name) values
  ('Combustível'),
  ('Manutenção'),
  ('Salários'),
  ('Aluguel'),
  ('Utilidades'),
  ('Outros');

-- Insert default company settings (update these values)
insert into public.company_settings (company_name, company_nuit, company_address, company_contact, default_currency) values
  ('Sua Empresa Lda', '000000000', 'Maputo, Moçambique', '+258 84 000 0000', 'MZN');

-- RLS Policies for Settings Tables
alter table public.payment_methods enable row level security;
alter table public.expense_categories enable row level security;
alter table public.company_settings enable row level security;

-- Everyone can read settings
create policy "Enable read access for authenticated users" on public.payment_methods for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.expense_categories for select using (auth.role() = 'authenticated');
create policy "Enable read access for authenticated users" on public.company_settings for select using (auth.role() = 'authenticated');

-- Only admins can modify (we'll refine this after auth is set up)
create policy "Enable insert for authenticated users" on public.payment_methods for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.payment_methods for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.payment_methods for delete using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.expense_categories for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users" on public.expense_categories for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users" on public.expense_categories for delete using (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.company_settings for update using (auth.role() = 'authenticated');

-- Trigger to update company_settings timestamp
create trigger set_updated_at
  before update on public.company_settings
  for each row execute procedure public.handle_updated_at();
