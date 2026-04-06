import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getDeviceType(ua: string): string {
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { banner_id, event_type, page_path, session_id } = body;

    if (!banner_id || !event_type || !['click', 'impression'].includes(event_type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ua = request.headers.get('user-agent') || '';
    const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const ip = rawIp.length > 100 ? rawIp.slice(0, 100) : rawIp;
    const referrer = request.headers.get('referer') || '';

    await (supabase as any).from('ad_click_logs').insert({
      banner_id,
      event_type,
      user_id: user?.id || null,
      session_id: session_id || null,
      page_path: page_path || null,
      referrer: referrer || null,
      user_agent: ua.substring(0, 500),
      device_type: getDeviceType(ua),
      ip_hash: hashIP(ip),
      ip_address: ip === 'unknown' ? null : ip,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
