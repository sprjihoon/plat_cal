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

const SMARTSTORE_ORDER_HEADERS = [
  '상품주문번호', '주문번호', '주문일시', '결제일',
  '상품명', '옵션정보', '수량', '상품가격',
  '배송비', '주문상태',
];

const SMARTSTORE_SETTLEMENT_HEADERS = [
  '정산예정일', '주문번호', '상품명', '결제금액',
  '네이버페이 주문관리 수수료', '매출연동 수수료', '정산예정금액',
];

export const smartstoreParser: MarketParser = {
  name: '스마트스토어',
  channel: 'smartstore',

  detect(headers: string[]): boolean {
    const headerSet = new Set(headers.map(h => h.trim()));
    const hasSmartstore = headers.some(h =>
      h.includes('네이버') || h.includes('스마트스토어') ||
      h.includes('상품주문번호') || h.includes('네이버페이')
    );
    const orderMatch = SMARTSTORE_ORDER_HEADERS.filter(h => headerSet.has(h)).length;
    const settlementMatch = SMARTSTORE_SETTLEMENT_HEADERS.filter(h => headerSet.has(h)).length;
    return hasSmartstore || orderMatch >= 4 || settlementMatch >= 3;
  },

  parseOrders(data: Record<string, string>[]): MarketOrderRow[] {
    return data.map(row => {
      const unitPrice = parseNumber(row['상품가격'] || row['판매가'] || row['상품별 총 주문금액']);
      const quantity = parseNumber(row['수량']) || 1;
      const totalAmount = parseNumber(row['총 주문금액'] || row['결제금액']) || unitPrice * quantity;
      const platformFee = parseNumber(
        row['네이버페이 주문관리 수수료'] || row['매출연동 수수료'] || row['수수료']
      );
      const shippingFee = parseNumber(row['배송비'] || row['배송비 합계']);

      return {
        orderId: row['상품주문번호'] || row['주문번호'] || '',
        orderDate: parseDate(row['주문일시'] || row['결제일'] || row['주문일']),
        productName: row['상품명'] || '',
        optionName: row['옵션정보'] || row['옵션'] || '',
        quantity,
        unitPrice,
        totalAmount,
        platformFee,
        shippingFee,
        settlementAmount: totalAmount - platformFee,
        status: row['주문상태'] || row['발주확인 여부'] || '',
        channel: 'smartstore',
      };
    }).filter(row => row.productName);
  },

  parseSettlements(data: Record<string, string>[]): MarketSettlementRow[] {
    return data.map(row => {
      const saleAmount = parseNumber(row['결제금액'] || row['상품가격'] || row['총 주문금액']);
      const naverpayFee = parseNumber(row['네이버페이 주문관리 수수료'] || row['결제수수료']);
      const salesFee = parseNumber(row['매출연동 수수료'] || row['판매수수료']);
      const platformFee = naverpayFee + salesFee || parseNumber(row['수수료']);
      const shippingFee = parseNumber(row['배송비'] || row['배송비 합계']);
      const returnAmount = parseNumber(row['환불금액'] || row['반품금액']);
      const adjustmentAmount = parseNumber(row['조정금액'] || row['기타금액']);

      return {
        settlementDate: parseDate(row['정산예정일'] || row['정산완료일'] || row['정산일']),
        productName: row['상품명'] || '',
        orderId: row['상품주문번호'] || row['주문번호'] || '',
        saleAmount,
        platformFee,
        shippingFee,
        returnAmount,
        adjustmentAmount,
        settlementAmount: parseNumber(row['정산예정금액'] || row['정산금액']) || (saleAmount - platformFee - shippingFee - returnAmount + adjustmentAmount),
        channel: 'smartstore',
      };
    }).filter(row => row.productName || row.saleAmount > 0);
  },
};
