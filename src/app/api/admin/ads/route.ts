import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function GET() {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const { data, error } = await (supabase as any)
    .from('ad_banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banners: data });
}

export async function POST(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  const body = await request.json();
  const { title, subtitle, highlight, link_url, image_url, bg_color, text_color, highlight_color, sort_order } = body;

  if (!title) {
    return NextResponse.json({ error: '제목을 입력해주세요' }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from('ad_banners')
    .insert({
      title,
      subtitle: subtitle || null,
      highlight: highlight || null,
      link_url: link_url || null,
      image_url: image_url || null,
      bg_color: bg_color || '#4a5abf',
      text_color: text_color || '#ffffff',
      highlight_color: highlight_color || '#D6F74C',
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
