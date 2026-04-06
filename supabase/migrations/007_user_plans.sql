-- 유저 플랜 관리 (PG 연동 전까지는 모든 가입 유저 무료 사용)
-- plan: 'free' | 'pro' | 'plus'
alter table public.profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro', 'plus'));

comment on column public.profiles.plan is '유저 구독 플랜 (free/pro/plus). PG 연동 전까지 전원 free.';
