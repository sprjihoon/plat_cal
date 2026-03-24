import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_AUTH_URL = 'https://nid.naver.com/oauth2.0/authorize';

export async function GET() {
  if (!NAVER_CLIENT_ID) {
    return NextResponse.json(
      { error: 'NAVER_CLIENT_ID가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  const state = randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('naver_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  const redirectUri = `${baseUrl}/api/auth/naver/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
  });

  return NextResponse.redirect(`${NAVER_AUTH_URL}?${params.toString()}`);
}
