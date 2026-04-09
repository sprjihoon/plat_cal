-- Supabase 보안 어드바이저 대응: 서버 전용 테이블에 RLS 활성화
--
-- calc_rate_limit / calc_logs 는 서버(service role key)에서만 접근하므로
-- RLS를 켜도 기존 동작에 영향 없음.
-- (service role은 RLS를 항상 우회함)
-- 정책을 추가하지 않으면 anon/authenticated JWT로는 접근 불가 → 의도한 동작.

alter table public.calc_rate_limit enable row level security;
alter table public.calc_logs       enable row level security;
