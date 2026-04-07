-- 마진계산기 사용 횟수 추적 테이블 (로그인/비로그인 모두)
create table if not exists public.calc_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete set null,
  ip         text,
  is_auth    boolean     not null default false,
  mode       text,       -- 'profit'(순이익), 'price'(판매가), 'cost'(원가)
  created_at timestamptz not null default now()
);

-- 서비스 롤만 접근 (RLS 비활성화)
alter table public.calc_logs disable row level security;

-- 날짜/인증여부 기준 조회를 위한 인덱스
create index if not exists idx_calc_logs_created_at on public.calc_logs (created_at desc);
create index if not exists idx_calc_logs_user_id on public.calc_logs (user_id);

comment on table public.calc_logs is '마진계산기 사용 로그 (로그인/비로그인 모두 기록)';
