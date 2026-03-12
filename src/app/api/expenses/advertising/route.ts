import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const channel = searchParams.get('channel');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  const offset = (page - 1) * limit;

  let query = (supabase as any)
    .from('advertising_costs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('ad_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte('ad_date', startDate);
  }
  if (endDate) {
    query = query.lte('ad_date', endDate);
  }
  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    advertising: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      channel,
      ad_date,
      cost,
      impressions,
      clicks,
      conversions,
      ad_type,
      campaign_name,
      notes,
    } = body;

    if (!channel || !ad_date || cost === undefined) {
      return NextResponse.json({ error: '필수 항목을 입력하세요' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('advertising_costs')
      .insert({
        user_id: user.id,
        channel,
        ad_date,
        cost,
        impressions: impressions || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        ad_type: ad_type || null,
        campaign_name: campaign_name || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
