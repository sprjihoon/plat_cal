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

const COUPANG_ORDER_HEADERS = [
  '주문번호', '묶음배송번호', '주문일', '결제일',
  '노출상품명', '등록옵션명', '수량', '판매가',
  '배송비구분', '주문상태',
];

const COUPANG_SETTLEMENT_HEADERS = [
  '정산예정일', '주문번호', '상품명', '판매금액',
  '수수료', '배송비', '정산예정금액',
];

export const coupangParser: MarketParser = {
  name: '쿠팡',
  channel: 'coupang',

  detect(headers: string[]): boolean {
    const headerSet = new Set(headers.map(h => h.trim()));
    const orderMatch = COUPANG_ORDER_HEADERS.filter(h => headerSet.has(h)).length;
    const settlementMatch = COUPANG_SETTLEMENT_HEADERS.filter(h => headerSet.has(h)).length;
    return orderMatch >= 3 || settlementMatch >= 3;
  },

  parseOrders(data: Record<string, string>[]): MarketOrderRow[] {
    return data.map(row => {
      const unitPrice = parseNumber(row['판매가'] || row['판매단가']);
      const quantity = parseNumber(row['수량']) || 1;
      const totalAmount = parseNumber(row['결제금액'] || row['상품금액']) || unitPrice * quantity;
      const platformFee = parseNumber(row['판매수수료'] || row['수수료']);
      const shippingFee = parseNumber(row['배송비']);

      return {
        orderId: row['주문번호'] || row['묶음배송번호'] || '',
        orderDate: parseDate(row['주문일'] || row['결제일'] || row['주문날짜']),
        productName: row['노출상품명'] || row['상품명'] || row['등록상품명'] || '',
        optionName: row['등록옵션명'] || row['옵션'] || row['옵션명'] || '',
        quantity,
        unitPrice,
        totalAmount,
        platformFee,
        shippingFee,
        settlementAmount: totalAmount - platformFee,
        status: row['주문상태'] || row['배송상태'] || '',
        channel: 'coupang',
      };
    }).filter(row => row.productName);
  },

  parseSettlements(data: Record<string, string>[]): MarketSettlementRow[] {
    return data.map(row => {
      const saleAmount = parseNumber(row['판매금액'] || row['상품금액'] || row['결제금액']);
      const platformFee = parseNumber(row['수수료'] || row['판매수수료'] || row['쿠팡수수료']);
      const shippingFee = parseNumber(row['배송비'] || row['배송비정산']);
      const returnAmount = parseNumber(row['반품금액'] || row['환불금액']);
      const adjustmentAmount = parseNumber(row['조정금액'] || row['기타']);

      return {
        settlementDate: parseDate(row['정산예정일'] || row['정산일'] || row['정산완료일']),
        productName: row['상품명'] || row['노출상품명'] || '',
        orderId: row['주문번호'] || '',
        saleAmount,
        platformFee,
        shippingFee,
        returnAmount,
        adjustmentAmount,
        settlementAmount: parseNumber(row['정산예정금액'] || row['정산금액']) || (saleAmount - platformFee - shippingFee - returnAmount + adjustmentAmount),
        channel: 'coupang',
      };
    }).filter(row => row.productName || row.saleAmount > 0);
  },
};
