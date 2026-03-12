import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.newPassword || body.newPassword.length < 8) {
    return NextResponse.json(
      { error: '비밀번호는 8자 이상이어야 합니다' },
      { status: 400 }
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: body.newPassword,
  });

  if (error) {
    if (error.message.includes('same as')) {
      return NextResponse.json(
        { error: '이전과 다른 비밀번호를 입력해주세요' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
