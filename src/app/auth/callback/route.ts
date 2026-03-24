import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  function getRedirectUrl(path: string) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    if (isLocalEnv) return `${origin}${path}`;
    if (forwardedHost) return `https://${forwardedHost}${path}`;
    return `${origin}${path}`;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'magiclink' });
    if (!error) {
      return NextResponse.redirect(getRedirectUrl(next));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getRedirectUrl(next));
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
