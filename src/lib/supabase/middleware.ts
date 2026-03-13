import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isSupabaseConfigured(): boolean {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co')
  );
}

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  let response = supabaseResponse;

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ['/dashboard', '/products', '/sales', '/expenses', '/reports', '/settings', '/import'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (request.nextUrl.pathname === '/auth/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}
