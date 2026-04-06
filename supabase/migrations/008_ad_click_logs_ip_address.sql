-- 관리자 성과 분석용: 클릭 시점 IP (RLL은 기존 정책 유지, 클라이언트는 조회 불가)
alter table public.ad_click_logs
  add column if not exists ip_address text;

comment on column public.ad_click_logs.ip_address is '클릭/노출 시점 클라이언트 IP (관리자 API 전용)';
