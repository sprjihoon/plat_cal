/**
 * 클라이언트 사이드 개인정보 필터링 유틸리티
 * 엑셀/CSV 데이터에서 개인정보(주소, 전화번호, 이름 등)를 서버 전송 전에 제거
 */

const PERSONAL_INFO_HEADERS_KO = [
  '수취인', '수취인명', '수령인', '수령인명', '받는분', '받는사람',
  '주문자', '주문자명', '구매자', '구매자명', '구매자이름',
  '주소', '배송지', '배송주소', '수취인주소', '받는분주소',
  '상세주소', '기본주소', '도로명주소', '지번주소', '우편번호',
  '전화번호', '연락처', '휴대폰', '핸드폰', '수취인연락처',
  '수취인전화번호', '주문자연락처', '주문자전화번호',
  '연락처1', '연락처2', '전화번호1', '전화번호2',
  '이메일', '메일', 'email', 'e-mail',
  '배송메시지', '배송메모', '배송요청사항', '요청사항',
  '개인통관고유부호', '통관부호',
];

const PERSONAL_INFO_HEADERS_EN = [
  'recipient', 'receiver', 'buyer_name', 'customer_name', 'orderer',
  'address', 'shipping_address', 'delivery_address', 'street_address',
  'detail_address', 'zip_code', 'postal_code', 'zipcode',
  'phone', 'phone_number', 'mobile', 'tel', 'contact',
  'phone1', 'phone2', 'contact1', 'contact2',
  'email', 'e_mail', 'buyer_email',
  'delivery_message', 'shipping_note', 'memo',
  'personal_customs_code',
];

const ALL_PERSONAL_HEADERS = [
  ...PERSONAL_INFO_HEADERS_KO.map(h => h.toLowerCase()),
  ...PERSONAL_INFO_HEADERS_EN.map(h => h.toLowerCase()),
];

const PHONE_REGEX = /^0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_KEYWORDS = ['시', '구', '동', '로', '길', '아파트', '번지', '층', '호'];

export interface FilterResult {
  filteredData: Record<string, string>[];
  removedColumns: string[];
  warnings: string[];
}

export function isPersonalInfoHeader(header: string): boolean {
  const normalized = header.toLowerCase().trim().replace(/\s+/g, '');
  return ALL_PERSONAL_HEADERS.some(ph => {
    const normalizedPh = ph.replace(/\s+/g, '');
    return normalized === normalizedPh || normalized.includes(normalizedPh) || normalizedPh.includes(normalized);
  });
}

function looksLikePersonalData(values: string[]): boolean {
  const sample = values.filter(v => v && v.trim()).slice(0, 20);
  if (sample.length === 0) return false;

  let phoneCount = 0;
  let emailCount = 0;
  let addressCount = 0;

  for (const val of sample) {
    const cleaned = val.replace(/"/g, '').trim();
    if (PHONE_REGEX.test(cleaned)) phoneCount++;
    if (EMAIL_REGEX.test(cleaned)) emailCount++;
    if (ADDRESS_KEYWORDS.filter(kw => cleaned.includes(kw)).length >= 2) addressCount++;
  }

  const threshold = sample.length * 0.3;
  return phoneCount > threshold || emailCount > threshold || addressCount > threshold;
}

export function filterPersonalInfo(
  data: Record<string, string>[],
  headers: string[]
): FilterResult {
  const removedColumns: string[] = [];
  const warnings: string[] = [];

  const headerRemovalSet = new Set<string>();

  for (const header of headers) {
    if (isPersonalInfoHeader(header)) {
      headerRemovalSet.add(header);
      removedColumns.push(header);
    }
  }

  for (const header of headers) {
    if (headerRemovalSet.has(header)) continue;
    const columnValues = data.map(row => row[header] || '');
    if (looksLikePersonalData(columnValues)) {
      headerRemovalSet.add(header);
      removedColumns.push(header);
      warnings.push(`'${header}' 열에 개인정보로 의심되는 데이터가 감지되어 자동 제거되었습니다.`);
    }
  }

  const filteredData = data.map(row => {
    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (!headerRemovalSet.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  });

  if (removedColumns.length > 0) {
    warnings.unshift(
      `개인정보 보호를 위해 ${removedColumns.length}개 열이 제거되었습니다: ${removedColumns.join(', ')}`
    );
  }

  return { filteredData, removedColumns, warnings };
}

export function getPersonalInfoColumns(headers: string[]): string[] {
  return headers.filter(h => isPersonalInfoHeader(h));
}

export function getSafeColumns(headers: string[]): string[] {
  return headers.filter(h => !isPersonalInfoHeader(h));
}
