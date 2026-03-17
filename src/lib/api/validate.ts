import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from './rate-limit';

interface AuthResult {
  user: { id: string; email?: string };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

interface AdminAuthResult extends AuthResult {
  serviceClient: Awaited<ReturnType<typeof createServiceClient>>;
}

export async function withAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user, supabase };
}

export async function withAdminAuth(): Promise<AdminAuthResult | NextResponse> {
  const auth = await withAuth();
  if (auth instanceof NextResponse) return auth;

  const { data: adminRow } = await (auth.supabase as any)
    .from('admin_users')
    .select('id')
    .eq('user_id', auth.user.id)
    .single();

  if (!adminRow) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  return { ...auth, serviceClient };
}

export function withRateLimit(
  userId: string,
  endpoint: string,
  maxRequests = 30
): NextResponse | null {
  const key = `${userId}:${endpoint}`;
  const result = checkRateLimit(key, { maxRequests });

  if (!result.allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
        },
      }
    );
  }

  return null;
}

export function validateBody<T extends z.ZodType>(
  data: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((i) => i.message);
    return {
      success: false,
      response: NextResponse.json(
        { error: '입력값이 올바르지 않습니다', details: errors },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}
