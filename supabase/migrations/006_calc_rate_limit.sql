-- 비회원 마진계산기 IP당 하루 5회 제한을 위한 테이블
create table if not exists public.calc_rate_limit (
  ip       text        primary key,
  count    integer     not null default 0,
  reset_at timestamptz not null
);

-- 서비스 롤만 접근 (RLS 비활성화 — 서버에서만 service key로 호출)
alter table public.calc_rate_limit disable row level security;

-- 오래된 레코드 자동 정리를 위한 인덱스
create index if not exists idx_calc_rate_limit_reset_at on public.calc_rate_limit (reset_at);

comment on table public.calc_rate_limit is '비회원 마진계산기 IP별 일일 사용 횟수 추적';
