create extension if not exists pgcrypto;

create type public.payment_method as enum ('pix', 'cash', 'card', 'transfer', 'other');
create type public.sale_mode as enum ('paid_now', 'credit', 'installments');
create type public.cash_direction as enum ('income', 'expense');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Bazar Casual',
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  due_alert_days smallint not null default 3 check (due_alert_days between 0 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  description text,
  sold_on date not null default current_date,
  total_cents bigint not null check (total_cents > 0),
  mode public.sale_mode not null,
  notes text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  constraint sales_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id)
);

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sale_id uuid not null,
  installment_number smallint not null check (installment_number > 0),
  due_date date not null,
  amount_cents bigint not null check (amount_cents > 0),
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sale_id, installment_number),
  unique (id, owner_id),
  constraint installments_sale_owner_fk foreign key (sale_id, owner_id)
    references public.sales(id, owner_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  installment_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  paid_at timestamptz not null default now(),
  method public.payment_method not null default 'pix',
  notes text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  constraint payments_installment_owner_fk foreign key (installment_id, owner_id)
    references public.installments(id, owner_id)
);

create table public.cash_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  direction public.cash_direction not null,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null default current_date,
  category text not null,
  description text not null check (length(trim(description)) > 0),
  notes text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create index customers_owner_name_idx on public.customers (owner_id, name);
create index sales_owner_sold_on_idx on public.sales (owner_id, sold_on desc);
create index installments_owner_due_date_idx on public.installments (owner_id, due_date);
create index payments_installment_paid_at_idx on public.payments (installment_id, paid_at desc);
create index cash_entries_owner_occurred_on_idx on public.cash_entries (owner_id, occurred_on desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger customers_touch_updated_at before update on public.customers
for each row execute function public.touch_updated_at();
create trigger sales_touch_updated_at before update on public.sales
for each row execute function public.touch_updated_at();
create trigger installments_touch_updated_at before update on public.installments
for each row execute function public.touch_updated_at();
create trigger payments_touch_updated_at before update on public.payments
for each row execute function public.touch_updated_at();
create trigger cash_entries_touch_updated_at before update on public.cash_entries
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Bazar Casual'));
  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.cash_entries enable row level security;

revoke all on table public.profiles, public.customers, public.sales, public.installments, public.payments, public.cash_entries from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.customers, public.sales, public.installments, public.payments, public.cash_entries to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "customers_select_own" on public.customers for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "customers_insert_own" on public.customers for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "customers_update_own" on public.customers for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "sales_select_own" on public.sales for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "sales_insert_own" on public.sales for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "sales_update_own" on public.sales for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "installments_select_own" on public.installments for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "installments_insert_own" on public.installments for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "installments_update_own" on public.installments for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "payments_select_own" on public.payments for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "payments_insert_own" on public.payments for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "payments_update_own" on public.payments for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "cash_entries_select_own" on public.cash_entries for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "cash_entries_insert_own" on public.cash_entries for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "cash_entries_update_own" on public.cash_entries for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create view public.installment_balances
with (security_invoker = true)
as
select
  i.id,
  i.owner_id,
  i.sale_id,
  i.installment_number,
  i.due_date,
  i.amount_cents,
  coalesce(sum(p.amount_cents) filter (where p.voided_at is null), 0)::bigint as paid_cents,
  (i.amount_cents - coalesce(sum(p.amount_cents) filter (where p.voided_at is null), 0))::bigint as outstanding_cents,
  case
    when i.voided_at is not null then 'cancelled'
    when coalesce(sum(p.amount_cents) filter (where p.voided_at is null), 0) >= i.amount_cents then 'paid'
    when i.due_date < timezone('America/Sao_Paulo', now())::date
      and coalesce(sum(p.amount_cents) filter (where p.voided_at is null), 0) > 0 then 'partially_overdue'
    when i.due_date < timezone('America/Sao_Paulo', now())::date then 'overdue'
    when coalesce(sum(p.amount_cents) filter (where p.voided_at is null), 0) > 0 then 'partial'
    when i.due_date = timezone('America/Sao_Paulo', now())::date then 'due_today'
    else 'pending'
  end as status
from public.installments i
left join public.payments p on p.installment_id = i.id and p.owner_id = i.owner_id
group by i.id;

revoke all on public.installment_balances from anon, authenticated;
grant select on public.installment_balances to authenticated;

create or replace function public.record_payment(
  installment_id_input uuid,
  amount_cents_input bigint,
  paid_at_input timestamptz default now(),
  method_input public.payment_method default 'pix',
  notes_input text default null
)
returns public.payments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target public.installments;
  already_paid bigint;
  created public.payments;
begin
  if amount_cents_input <= 0 then
    raise exception 'O valor do pagamento deve ser positivo';
  end if;

  select * into target
  from public.installments
  where id = installment_id_input
    and owner_id = auth.uid()
    and voided_at is null
  for update;

  if not found then
    raise exception 'Cobrança não encontrada';
  end if;

  select coalesce(sum(amount_cents), 0) into already_paid
  from public.payments
  where installment_id = installment_id_input
    and owner_id = auth.uid()
    and voided_at is null;

  if amount_cents_input > target.amount_cents - already_paid then
    raise exception 'O pagamento é maior que o saldo restante';
  end if;

  insert into public.payments (owner_id, installment_id, amount_cents, paid_at, method, notes)
  values (auth.uid(), installment_id_input, amount_cents_input, paid_at_input, method_input, notes_input)
  returning * into created;

  return created;
end;
$$;

revoke all on function public.record_payment(uuid, bigint, timestamptz, public.payment_method, text) from public, anon;
grant execute on function public.record_payment(uuid, bigint, timestamptz, public.payment_method, text) to authenticated;
