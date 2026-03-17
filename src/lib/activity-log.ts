export async function logActivity(
  supabase: any,
  userId: string,
  action: string,
  resource?: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase
      .from('user_activity_logs')
      .insert({ user_id: userId, action, resource, metadata });
  } catch {
    // 로그 실패는 무시 (핵심 기능에 영향 없음)
  }
}
