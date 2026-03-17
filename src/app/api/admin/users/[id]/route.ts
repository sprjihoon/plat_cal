import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/api/validate';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient, user: admin } = auth;
  const { id: targetUserId } = await params;

  const body = await request.json();
  const { action } = body;

  if (action === 'suspend') {
    const reason = body.reason || '관리자에 의한 일시정지';
    await (serviceClient as any)
      .from('user_status')
      .upsert({
        user_id: targetUserId,
        status: 'suspended',
        suspended_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: admin.id,
      });
    return NextResponse.json({ success: true, message: '계정이 일시정지되었습니다' });
  }

  if (action === 'activate') {
    await (serviceClient as any)
      .from('user_status')
      .upsert({
        user_id: targetUserId,
        status: 'active',
        suspended_reason: null,
        suspended_at: null,
        suspended_by: null,
      });
    return NextResponse.json({ success: true, message: '계정이 활성화되었습니다' });
  }

  if (action === 'reset_data') {
    const tables = ['sales_records', 'advertising_costs', 'operating_expenses', 'goals', 'platform_settings'];
    for (const table of tables) {
      await (serviceClient as any).from(table).delete().eq('user_id', targetUserId);
    }
    const { data: products } = await (serviceClient as any)
      .from('products')
      .select('id')
      .eq('user_id', targetUserId);
    if (products?.length) {
      const productIds = products.map((p: any) => p.id);
      await (serviceClient as any).from('product_markets').delete().in('product_id', productIds);
    }
    await (serviceClient as any).from('products').delete().eq('user_id', targetUserId);
    return NextResponse.json({ success: true, message: '유저 데이터가 초기화되었습니다' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;
  const { serviceClient } = auth;
  const { id: targetUserId } = await params;

  const { error } = await serviceClient.auth.admin.deleteUser(targetUserId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '계정이 삭제되었습니다' });
}
