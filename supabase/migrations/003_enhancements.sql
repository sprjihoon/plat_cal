-- =============================================
-- 003: 기능 보완 마이그레이션
-- =============================================

-- 1. products 테이블에 재고 관련 컬럼 추가
alter table public.products
  add column if not exists stock_quantity integer default 0 not null,
  add column if not exists low_stock_threshold integer default 10 not null;

-- 2. sales_records 테이블에 주문 상태 컬럼 추가
alter table public.sales_records
  add column if not exists status text default 'completed' not null;

-- 3. platform_settings 테이블에 created_at 추가
alter table public.platform_settings
  add column if not exists created_at timestamptz default now() not null;

-- 4. 복합 인덱스 추가
create index if not exists idx_sales_records_user_date on public.sales_records(user_id, sale_date);
create index if not exists idx_sales_records_user_channel on public.sales_records(user_id, channel);
create index if not exists idx_sales_records_user_product on public.sales_records(user_id, product_id);
create index if not exists idx_sales_records_status on public.sales_records(status);
create index if not exists idx_advertising_costs_user_date on public.advertising_costs(user_id, ad_date);
create index if not exists idx_operating_expenses_user_date on public.operating_expenses(user_id, expense_date);

-- 5. 목표 설정 테이블
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

-- 6. 알림 테이블
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications"
  on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);
create policy "Users can delete own notifications"
  on public.notifications for delete using (auth.uid() = user_id);

-- 7. 정산 일정 테이블
create table if not exists public.settlement_schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  channel text not null,
  settlement_cycle text not null,
  next_settlement_date date,
  expected_amount numeric default 0,
  actual_amount numeric,
  is_confirmed boolean default false not null,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_settlement_user_id on public.settlement_schedules(user_id);
create index if not exists idx_settlement_next_date on public.settlement_schedules(user_id, next_settlement_date);

alter table public.settlement_schedules enable row level security;

create policy "Users can view own settlements"
  on public.settlement_schedules for select using (auth.uid() = user_id);
create policy "Users can insert own settlements"
  on public.settlement_schedules for insert with check (auth.uid() = user_id);
create policy "Users can update own settlements"
  on public.settlement_schedules for update using (auth.uid() = user_id);
create policy "Users can delete own settlements"
  on public.settlement_schedules for delete using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.settlement_schedules;
create trigger set_updated_at before update on public.settlement_schedules
  for each row execute procedure public.handle_updated_at();
