-- =============================================
-- 쇼핑몰 수익 관리 시스템 - Supabase DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- =============================================
-- 2. 테이블 생성
-- =============================================

-- 프로필 테이블
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 상품 테이블
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  sku text,
  base_cost numeric default 0 not null,
  
  image_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 상품별 마켓 설정 테이블
create table if not exists public.product_markets (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products on delete cascade not null,
  channel text not null,
  sub_option_id text,
  selling_price numeric not null,
  platform_fee_rate numeric default 0 not null,
  payment_fee_rate numeric default 0 not null,
  additional_costs jsonb,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 플랫폼 설정 테이블
create table if not exists public.platform_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  custom_presets jsonb,
  updated_at timestamptz default now() not null
);

-- 판매 기록 테이블
create table if not exists public.sales_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  product_market_id uuid references public.product_markets on delete set null,
  channel text not null,
  sale_date date not null,
  quantity integer default 1 not null,
  unit_price numeric default 0 not null,
  total_revenue numeric default 0 not null,
  platform_fee numeric default 0,
  payment_fee numeric default 0,
  net_profit numeric default 0,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 광고비 테이블
create table if not exists public.advertising_costs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  channel text not null,
  ad_date date not null,
  cost numeric not null,
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  ad_type text,
  campaign_name text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 운영비 테이블
create table if not exists public.operating_expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  expense_date date not null,
  category text not null,
  amount numeric not null,
  description text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- =============================================
-- 3. 인덱스 생성
-- =============================================

create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_product_markets_product_id on public.product_markets(product_id);
create index if not exists idx_product_markets_channel on public.product_markets(channel);
create index if not exists idx_sales_records_user_id on public.sales_records(user_id);
create index if not exists idx_sales_records_product_id on public.sales_records(product_id);
create index if not exists idx_sales_records_sale_date on public.sales_records(sale_date);
create index if not exists idx_sales_records_channel on public.sales_records(channel);
create index if not exists idx_advertising_costs_user_id on public.advertising_costs(user_id);
create index if not exists idx_advertising_costs_ad_date on public.advertising_costs(ad_date);
create index if not exists idx_operating_expenses_user_id on public.operating_expenses(user_id);
create index if not exists idx_operating_expenses_expense_date on public.operating_expenses(expense_date);

-- =============================================
-- 4. Row Level Security (RLS) 활성화
-- =============================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_markets enable row level security;
alter table public.platform_settings enable row level security;
alter table public.sales_records enable row level security;
alter table public.advertising_costs enable row level security;
alter table public.operating_expenses enable row level security;

-- =============================================
-- 5. RLS 정책 생성
-- =============================================

-- profiles: 본인 프로필만 접근
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- products: 본인 상품만 접근
create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id);

create policy "Users can delete own products"
  on public.products for delete
  using (auth.uid() = user_id);

-- product_markets: 본인 상품의 마켓 설정만 접근
create policy "Users can view own product markets"
  on public.product_markets for select
  using (
    exists (
      select 1 from public.products
      where products.id = product_markets.product_id
      and products.user_id = auth.uid()
    )
  );

create policy "Users can insert own product markets"
  on public.product_markets for insert
  with check (
    exists (
      select 1 from public.products
      where products.id = product_markets.product_id
      and products.user_id = auth.uid()
    )
  );

create policy "Users can update own product markets"
  on public.product_markets for update
  using (
    exists (
      select 1 from public.products
      where products.id = product_markets.product_id
      and products.user_id = auth.uid()
    )
  );

create policy "Users can delete own product markets"
  on public.product_markets for delete
  using (
    exists (
      select 1 from public.products
      where products.id = product_markets.product_id
      and products.user_id = auth.uid()
    )
  );

-- platform_settings: 본인 설정만 접근
create policy "Users can view own settings"
  on public.platform_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.platform_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.platform_settings for update
  using (auth.uid() = user_id);

-- sales_records: 본인 판매 기록만 접근
create policy "Users can view own sales"
  on public.sales_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own sales"
  on public.sales_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sales"
  on public.sales_records for update
  using (auth.uid() = user_id);

create policy "Users can delete own sales"
  on public.sales_records for delete
  using (auth.uid() = user_id);

-- advertising_costs: 본인 광고비만 접근
create policy "Users can view own ads"
  on public.advertising_costs for select
  using (auth.uid() = user_id);

create policy "Users can insert own ads"
  on public.advertising_costs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ads"
  on public.advertising_costs for update
  using (auth.uid() = user_id);

create policy "Users can delete own ads"
  on public.advertising_costs for delete
  using (auth.uid() = user_id);

-- operating_expenses: 본인 운영비만 접근
create policy "Users can view own expenses"
  on public.operating_expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.operating_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.operating_expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.operating_expenses for delete
  using (auth.uid() = user_id);

-- =============================================
-- 6. 트리거: 회원가입 시 프로필 자동 생성
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 기존 트리거가 있으면 삭제 후 재생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 7. 트리거: updated_at 자동 갱신
-- =============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at before update on public.products
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.product_markets;
create trigger set_updated_at before update on public.product_markets
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.sales_records;
create trigger set_updated_at before update on public.sales_records
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.advertising_costs;
create trigger set_updated_at before update on public.advertising_costs
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at on public.operating_expenses;
create trigger set_updated_at before update on public.operating_expenses
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 목표 설정 테이블
-- ============================================================
create table if not exists public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  period_start date not null,
  period_end date not null,
  target_revenue numeric default 0,
  target_margin_rate numeric default 0,
  target_roas numeric default 0,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goals_period on public.goals(user_id, period_start, period_end);

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals"
  on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals"
  on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals"
  on public.goals for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at before update on public.goals
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- 관리자 시스템 테이블
-- ============================================================

-- 관리자 목록 (profiles.id를 참조, 특정 유저를 관리자로 지정)
create table if not exists public.admin_users (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  role text default 'admin' not null,
  created_at timestamptz default now() not null
);

alter table public.admin_users enable row level security;
create policy "Users can check own admin status"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- 공지사항
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references auth.users not null,
  title text not null,
  content text not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_announcements_active on public.announcements(is_active, created_at desc);

alter table public.announcements enable row level security;
create policy "Anyone can view active announcements"
  on public.announcements for select using (true);
create policy "Admins can manage announcements"
  on public.announcements for all
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop trigger if exists set_updated_at on public.announcements;
create trigger set_updated_at before update on public.announcements
  for each row execute procedure public.handle_updated_at();

-- 유저 활동 로그
create table if not exists public.user_activity_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  resource text,
  metadata jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_activity_logs_user on public.user_activity_logs(user_id, created_at desc);
create index if not exists idx_activity_logs_action on public.user_activity_logs(action, created_at desc);
create index if not exists idx_activity_logs_created on public.user_activity_logs(created_at desc);

alter table public.user_activity_logs enable row level security;
create policy "Admins can view all activity logs"
  on public.user_activity_logs for select
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
create policy "Users can insert own logs"
  on public.user_activity_logs for insert
  with check (auth.uid() = user_id);

-- 유저 상태 관리 (일시정지 등)
create table if not exists public.user_status (
  user_id uuid references auth.users on delete cascade primary key,
  status text default 'active' not null,
  suspended_reason text,
  suspended_at timestamptz,
  suspended_by uuid references auth.users,
  updated_at timestamptz default now() not null
);

alter table public.user_status enable row level security;
create policy "Users can view own status"
  on public.user_status for select using (auth.uid() = user_id);
create policy "Admins can manage user status"
  on public.user_status for all
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

drop trigger if exists set_updated_at on public.user_status;
create trigger set_updated_at before update on public.user_status
  for each row execute procedure public.handle_updated_at();
