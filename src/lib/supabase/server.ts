import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('https://')) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey };
}

export async function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      'Supabase가 설정되지 않았습니다. .env.local 파일에 환경변수를 설정해주세요.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출된 경우 무시
        }
      },
    },
  });
}

export async function createServiceClient() {
  const config = getSupabaseConfig();

  if (!config || !config.supabaseServiceKey) {
    throw new Error(
      'Supabase Service Role Key가 설정되지 않았습니다.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(config.supabaseUrl, config.supabaseServiceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출된 경우 무시
        }
      },
    },
  });
}
