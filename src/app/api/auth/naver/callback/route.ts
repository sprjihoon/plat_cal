import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/server';

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;
const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    name?: string;
    nickname?: string;
    profile_image?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_auth_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_missing_params`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('naver_oauth_state')?.value;
  cookieStore.delete('naver_oauth_state');

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/auth/login?error=naver_invalid_state`);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/auth/naver/callback`;

    const tokenResponse = await fetch(NAVER_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: NAVER_CLIENT_ID,
        client_secret: NAVER_CLIENT_SECRET,
        code,
        state,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_no_token`);
    }

    const profileResponse = await fetch(NAVER_PROFILE_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_profile_failed`);
    }

    const profileData: NaverProfile = await profileResponse.json();
    const naverUser = profileData.response;

    if (!naverUser.id) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_no_user`);
    }

    const supabase = await createServiceClient();
    const naverEmail = naverUser.email || `naver_${naverUser.id}@naver.placeholder`;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) =>
        u.app_metadata?.provider === 'naver' &&
        u.app_metadata?.naver_id === naverUser.id
    );

    let userId: string;

    if (existingUser) {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          name: naverUser.name || naverUser.nickname || existingUser.user_metadata?.name,
          avatar_url: naverUser.profile_image || existingUser.user_metadata?.avatar_url,
          provider: 'naver',
        },
      });
      userId = existingUser.id;
    } else {
      const { data: userByEmail } = await supabase.auth.admin.listUsers();
      const emailUser = naverUser.email
        ? userByEmail?.users?.find((u) => u.email === naverUser.email)
        : null;

      if (emailUser) {
        await supabase.auth.admin.updateUserById(emailUser.id, {
          app_metadata: {
            ...emailUser.app_metadata,
            provider: 'naver',
            naver_id: naverUser.id,
          },
          user_metadata: {
            ...emailUser.user_metadata,
            name: naverUser.name || naverUser.nickname || emailUser.user_metadata?.name,
            avatar_url: naverUser.profile_image || emailUser.user_metadata?.avatar_url,
            provider: 'naver',
          },
        });
        userId = emailUser.id;
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: naverEmail,
          email_confirm: true,
          app_metadata: {
            provider: 'naver',
            naver_id: naverUser.id,
          },
          user_metadata: {
            name: naverUser.name || naverUser.nickname || '네이버 사용자',
            avatar_url: naverUser.profile_image,
            provider: 'naver',
          },
        });

        if (createError || !newUser.user) {
          console.error('Naver user creation error:', createError);
          return NextResponse.redirect(`${origin}/auth/login?error=naver_create_failed`);
        }
        userId = newUser.user.id;
      }
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: naverEmail,
      });

    if (sessionError || !sessionData) {
      console.error('Session generation error:', sessionError);
      return NextResponse.redirect(`${origin}/auth/login?error=naver_session_failed`);
    }

    const hashed_token = sessionData.properties?.hashed_token;
    if (!hashed_token) {
      return NextResponse.redirect(`${origin}/auth/login?error=naver_session_failed`);
    }

    const verifyUrl = new URL('/auth/callback', origin);
    verifyUrl.searchParams.set('token_hash', hashed_token);
    verifyUrl.searchParams.set('type', 'magiclink');
    verifyUrl.searchParams.set('next', '/dashboard');

    return NextResponse.redirect(verifyUrl.toString());
  } catch (err) {
    console.error('Naver auth error:', err);
    return NextResponse.redirect(`${origin}/auth/login?error=naver_server_error`);
  }
}
