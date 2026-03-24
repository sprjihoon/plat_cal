-- 광고 클릭/노출 로그 테이블
create table if not exists public.ad_click_logs (
  id uuid default uuid_generate_v4() primary key,
  banner_id uuid references public.ad_banners on delete cascade not null,
  event_type text not null default 'click', -- 'click' | 'impression'
  user_id uuid references auth.users on delete set null,
  session_id text,
  page_path text,
  referrer text,
  user_agent text,
  device_type text, -- 'mobile' | 'tablet' | 'desktop'
  ip_hash text,
  created_at timestamptz default now() not null
);

create index if not exists idx_ad_click_logs_banner on public.ad_click_logs(banner_id, created_at desc);
create index if not exists idx_ad_click_logs_event on public.ad_click_logs(event_type, created_at desc);
create index if not exists idx_ad_click_logs_created on public.ad_click_logs(created_at desc);
create index if not exists idx_ad_click_logs_device on public.ad_click_logs(device_type, created_at desc);

alter table public.ad_click_logs enable row level security;

create policy "Anyone can insert ad logs"
  on public.ad_click_logs for insert
  with check (true);

create policy "Admins can view ad logs"
  on public.ad_click_logs for select
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- ad_banners에 노출/클릭 카운터 컬럼 추가 (빠른 집계용)
alter table public.ad_banners
  add column if not exists impression_count integer not null default 0,
  add column if not exists click_count integer not null default 0;
