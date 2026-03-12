import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const category = searchParams.get('category');

  const offset = (page - 1) * limit;

  let query = (supabase as any)
    .from('operating_expenses')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false });

  if (startDate) {
    query = query.gte('expense_date', startDate);
  }
  if (endDate) {
    query = query.lte('expense_date', endDate);
  }
  if (category) {
    query = query.eq('category', category);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: expenses, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    expenses,
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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data: expense, error } = await (supabase as any)
    .from('operating_expenses')
    .insert({
      user_id: user.id,
      expense_date: body.expense_date,
      category: body.category,
      amount: body.amount,
      description: body.description || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(expense, { status: 201 });
}
