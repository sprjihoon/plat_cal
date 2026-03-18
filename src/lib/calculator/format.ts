/**
 * 숫자 포맷팅 유틸리티
 */

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('ko-KR');
}

/**
 * 금액 포맷팅 (원 단위)
 */
export function formatCurrency(value: number): string {
  return `${formatNumber(Math.round(value))}원`;
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * 입력값에서 숫자만 추출
 */
export function parseNumericInput(value: string): number {
  // 콤마 제거 후 숫자만 추출
  const cleaned = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * 입력 중 콤마 포맷팅 (커서 위치 유지용)
 */
export function formatInputValue(value: string): string {
  // 빈 값이면 그대로 반환
  if (!value || value === '-') return value;

  // 숫자와 소수점, 마이너스만 남기기
  const cleaned = value.replace(/[^\d.-]/g, '');
  
  // 소수점 처리
  const parts = cleaned.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // 정수 부분에 콤마 추가
  const formattedInteger = integerPart
    ? parseInt(integerPart, 10).toLocaleString('ko-KR')
    : '';

  // 소수점이 있으면 붙이기
  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  // 원본에 소수점이 있었으면 유지
  if (value.endsWith('.')) {
    return `${formattedInteger}.`;
  }

  return formattedInteger || '0';
}

/**
 * 숫자를 입력 필드용 문자열로 변환
 */
export function numberToInputString(value: number): string {
  if (value === 0) return '';
  return formatNumber(value);
}

/**
 * 마진율에 따른 색상 클래스 반환
 */
export function getMarginColorClass(marginRate: number): string {
  if (marginRate >= 40) return 'text-[#4a5abf]';
  if (marginRate >= 25) return 'text-blue-600';
  if (marginRate >= 15) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * 마진율에 따른 배경 색상 클래스 반환
 */
export function getMarginBgClass(_marginRate: number): string {
  return 'bg-card border-border';
}

/**
 * 운영 판단 레벨에 따른 배지 색상
 */
export function getJudgmentBadgeVariant(
  level: 'stable' | 'manageable' | 'caution' | 'danger'
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'stable':
      return 'default';
    case 'manageable':
      return 'secondary';
    case 'caution':
      return 'outline';
    case 'danger':
      return 'destructive';
  }
}
