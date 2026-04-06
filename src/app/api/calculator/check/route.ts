import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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
  const now = new Date();

  const service = await createServiceClient();
  const { data } = await service
    .from('calc_rate_limit')
    .select('count, reset_at')
    .eq('ip', ip)
    .single();

  // 레코드 없거나 만료됐으면 full remaining
  if (!data || new Date(data.reset_at) <= now) {
    return NextResponse.json({
      isAuthenticated: false,
      allowed: true,
      remaining: DAILY_LIMIT,
      resetIn: WINDOW_MS,
      limit: DAILY_LIMIT,
    });
  }

  const remaining = Math.max(0, DAILY_LIMIT - data.count);
  const resetIn = new Date(data.reset_at).getTime() - now.getTime();

  return NextResponse.json({
    isAuthenticated: false,
    allowed: data.count < DAILY_LIMIT,
    remaining,
    resetIn,
    limit: DAILY_LIMIT,
  });
}

// 계산 1회 차감 (결과 표시 성공 후 호출)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.json({ isAuthenticated: true, allowed: true, remaining: null });
  }

  const ip = getClientIp(request);
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);

  const service = await createServiceClient();

  // 기존 레코드 조회
  const { data: existing } = await service
    .from('calc_rate_limit')
    .select('count, reset_at')
    .eq('ip', ip)
    .single();

  let newCount: number;
  let newResetAt: string;

  if (!existing || new Date(existing.reset_at) <= now) {
    // 신규 또는 만료 → 카운트 1로 초기화
    newCount = 1;
    newResetAt = resetAt.toISOString();
  } else {
    newCount = existing.count + 1;
    newResetAt = existing.reset_at;
  }

  // upsert
  await service
    .from('calc_rate_limit')
    .upsert({ ip, count: newCount, reset_at: newResetAt }, { onConflict: 'ip' });

  const allowed = newCount <= DAILY_LIMIT;
  const remaining = Math.max(0, DAILY_LIMIT - newCount);
  const resetIn = new Date(newResetAt).getTime() - now.getTime();

  return NextResponse.json({
    isAuthenticated: false,
    allowed,
    remaining,
    resetIn,
    limit: DAILY_LIMIT,
  }, {
    status: allowed ? 200 : 429,
  });
}
