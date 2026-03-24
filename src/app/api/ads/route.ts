import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from('ad_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ banners: [], error: error.message, code: error.code });
    }

    return NextResponse.json({ banners: data || [] });
  } catch (e: any) {
    return NextResponse.json({ banners: [], error: e?.message || 'unknown' });
  }
}
