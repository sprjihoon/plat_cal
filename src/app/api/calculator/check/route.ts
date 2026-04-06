import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, peekRateLimit } from '@/lib/api/rate-limit';

const DAILY_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// 현재 남은 횟수 조회 (카운트 증가 없음)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.json({ isAuthenticated: true, allowed: true, remaining: null });
  }

  const ip = getClientIp(request);
  const status = peekRateLimit(`calc_${ip}`, { windowMs: WINDOW_MS, maxRequests: DAILY_LIMIT });

  return NextResponse.json({
    isAuthenticated: false,
    allowed: status.allowed,
    remaining: status.remaining,
    resetIn: status.resetIn,
    limit: DAILY_LIMIT,
  });
}

// 계산 1회 차감 (실제 계산 전 호출)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.json({ isAuthenticated: true, allowed: true, remaining: null });
  }

  const ip = getClientIp(request);
  const result = checkRateLimit(`calc_${ip}`, { windowMs: WINDOW_MS, maxRequests: DAILY_LIMIT });

  return NextResponse.json({
    isAuthenticated: false,
    allowed: result.allowed,
    remaining: result.remaining,
    resetIn: result.resetIn,
    limit: DAILY_LIMIT,
  }, {
    status: result.allowed ? 200 : 429,
  });
}
