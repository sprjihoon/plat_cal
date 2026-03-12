import { MarketParser, MarketOrderRow, MarketSettlementRow } from './types';

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[,원\s]/g, '')) || 0;
}

function parseDate(val: string | undefined): string {
  if (!val) return new Date().toISOString().split('T')[0];
  const cleaned = val.replace(/\./g, '-').trim();
  const match = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }
  return cleaned;
}

const ZIGZAG_ORDER_HEADERS = [
  '주문번호', '주문일시', '결제일시',
  '상품명', '옵션', '수량', '결제금액',
  '주문상태', '상품코드',
];

const ZIGZAG_SETTLEMENT_HEADERS = [
  '정산예정일', '정산일', '주문번호', '상품명',
  '판매금액', '수수료', '정산금액',
  'Z결제 수수료', '카카오스타일 수수료',
];

export const zigzagParser: MarketParser = {
  name: '지그재그',
  channel: 'zigzag',

  detect(headers: string[]): boolean {
    const headerStr = headers.join(' ');
    const hasZigzag = headerStr.includes('지그재그') || headerStr.includes('zigzag') ||
                      headerStr.includes('카카오스타일') || headerStr.includes('Z결제') ||
                      headerStr.includes('직진배송');
    const headerSet = new Set(headers.map(h => h.trim()));
    const orderMatch = ZIGZAG_ORDER_HEADERS.filter(h => headerSet.has(h)).length;
    const settlementMatch = ZIGZAG_SETTLEMENT_HEADERS.filter(h => headerSet.has(h)).length;
    return hasZigzag || orderMatch >= 4 || settlementMatch >= 3;
  },

  parseOrders(data: Record<string, string>[]): MarketOrderRow[] {
    return data.map(row => {
      const unitPrice = parseNumber(row['판매가'] || row['판매단가'] || row['상품가격'] || row['상품금액']);
      const quantity = parseNumber(row['수량'] || row['주문수량']) || 1;
      const totalAmount = parseNumber(row['결제금액'] || row['주문금액'] || row['총결제금액']) || unitPrice * quantity;
      const platformFee = parseNumber(
        row['수수료'] || row['판매수수료'] || row['Z결제 수수료'] ||
        row['카카오스타일 수수료'] || row['지그재그 수수료']
      );
      const shippingFee = parseNumber(row['배송비'] || row['배송비합계']);

      return {
        orderId: row['주문번호'] || row['주문코드'] || '',
        orderDate: parseDate(row['주문일시'] || row['주문일'] || row['결제일시'] || row['결제일']),
        productName: row['상품명'] || row['상품'] || '',
        optionName: row['옵션'] || row['옵션명'] || row['옵션정보'] || '',
        quantity,
        unitPrice,
        totalAmount,
        platformFee,
        shippingFee,
        settlementAmount: totalAmount - platformFee,
        status: row['주문상태'] || row['배송상태'] || row['처리상태'] || '',
        channel: 'zigzag',
      };
    }).filter(row => row.productName);
  },

  parseSettlements(data: Record<string, string>[]): MarketSettlementRow[] {
    return data.map(row => {
      const saleAmount = parseNumber(row['판매금액'] || row['결제금액'] || row['상품금액'] || row['총결제금액']);
      const zPayFee = parseNumber(row['Z결제 수수료'] || row['결제수수료']);
      const styleFee = parseNumber(row['카카오스타일 수수료'] || row['판매수수료'] || row['지그재그 수수료']);
      const platformFee = zPayFee + styleFee || parseNumber(row['수수료'] || row['총수수료']);
      const shippingFee = parseNumber(row['배송비'] || row['배송비합계']);
      const returnAmount = parseNumber(row['반품금액'] || row['환불금액'] || row['취소금액']);
      const adjustmentAmount = parseNumber(row['조정금액'] || row['기타금액'] || row['프로모션차감']);

      return {
        settlementDate: parseDate(row['정산예정일'] || row['정산일'] || row['정산완료일']),
        productName: row['상품명'] || row['상품'] || '',
        orderId: row['주문번호'] || row['주문코드'] || '',
        saleAmount,
        platformFee,
        shippingFee,
        returnAmount,
        adjustmentAmount,
        settlementAmount: parseNumber(row['정산금액'] || row['정산예정금액'] || row['지급금액']) ||
          (saleAmount - platformFee - shippingFee - returnAmount + adjustmentAmount),
        channel: 'zigzag',
      };
    }).filter(row => row.productName || row.saleAmount > 0);
  },
};
