-- 광고 배너 테이블
create table if not exists public.ad_banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subtitle text,
  highlight text,
  link_url text,
  image_url text,
  bg_color text not null default '#1a1a2e',
  text_color text not null default '#ffffff',
  highlight_color text not null default '#8C9EFF',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ad_banners enable row level security;

create policy "Anyone can view active banners"
  on public.ad_banners for select
  using (is_active = true);

create policy "Admins can manage banners"
  on public.ad_banners for all
  using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

-- 기본 배너 데이터
insert into public.ad_banners (title, subtitle, highlight, link_url, bg_color, text_color, highlight_color, sort_order)
values
  ('패션풀필먼트는', 'Fashion Fulfillment', '스프링', 'https://spring3pl.co.kr', '#1a1a2e', '#ffffff', '#8C9EFF', 0),
  ('뷰티풀필먼트는', 'Beauty Fulfillment', '스프링', 'https://spring3pl.co.kr', '#1a1a2e', '#ffffff', '#FF8A9E', 1);
