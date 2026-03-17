import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function POST(request: NextRequest) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;

  const body = await request.json();
  const { target, userId, title, message, type = 'system' } = body;

  if (!title || !message) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요' }, { status: 400 });
  }

  if (target === 'all') {
    const { data: { users } } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const notifications = (users || []).map((u) => ({
      user_id: u.id,
      type,
      title,
      message,
    }));

    if (notifications.length > 0) {
      const { error } = await (serviceClient as any)
        .from('notifications')
        .insert(notifications);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sent: notifications.length });
  }

  if (target === 'user' && userId) {
    const { error } = await (serviceClient as any)
      .from('notifications')
      .insert({ user_id: userId, type, title, message });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, sent: 1 });
  }

  return NextResponse.json({ error: 'target은 "all" 또는 "user"여야 합니다' }, { status: 400 });
}
