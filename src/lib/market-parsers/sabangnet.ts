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

function mapChannelName(shopName: string): string {
  const name = shopName.trim().toLowerCase();
  if (name.includes('쿠팡') || name.includes('coupang')) return 'coupang';
  if (name.includes('스마트스토어') || name.includes('네이버') || name.includes('naver')) return 'smartstore';
  if (name.includes('11번가') || name.includes('11st')) return 'elevenst';
  if (name.includes('지마켓') || name.includes('gmarket') || name.includes('옥션') || name.includes('auction')) return 'gmarket';
  if (name.includes('지그재그') || name.includes('zigzag') || name.includes('카카오스타일')) return 'zigzag';
  if (name.includes('에이블리') || name.includes('ably')) return 'ably';
  if (name.includes('위메프') || name.includes('wemakeprice')) return 'wemakeprice';
  if (name.includes('티몬') || name.includes('tmon')) return 'tmon';
  if (name.includes('인터파크') || name.includes('interpark')) return 'interpark';
  if (name.includes('롯데온') || name.includes('lotteon')) return 'lotteon';
  if (name.includes('ssg') || name.includes('신세계')) return 'ssg';
  return shopName.trim();
}

const SABANGNET_ORDER_HEADERS = [
  '사방넷주문번호', '쇼핑몰', '쇼핑몰주문번호', '상품명',
  '수량', '판매가', '결제금액', '주문상태', '주문일',
  '송장번호', '옵션', '배송비',
];

const SABANGNET_SETTLEMENT_HEADERS = [
  '쇼핑몰', '정산금액', '판매금액', '수수료',
  '쇼핑몰주문번호', '상품명', '정산일',
];

export const sabangnetParser: MarketParser = {
  name: '사방넷',
  channel: 'sabangnet',

  detect(headers: string[]): boolean {
    const headerSet = new Set(headers.map(h => h.trim()));
    const hasSabangnet = headers.some(h =>
      h.includes('사방넷') || h.includes('사방넷주문번호')
    );
    const hasShopAndOrder = headerSet.has('쇼핑몰') && (
      headerSet.has('쇼핑몰주문번호') || headerSet.has('사방넷주문번호')
    );
    const orderMatch = SABANGNET_ORDER_HEADERS.filter(h => headerSet.has(h)).length;
    const settlementMatch = SABANGNET_SETTLEMENT_HEADERS.filter(h => headerSet.has(h)).length;
    return hasSabangnet || hasShopAndOrder || orderMatch >= 5 || settlementMatch >= 4;
  },

  parseOrders(data: Record<string, string>[]): MarketOrderRow[] {
    return data.map(row => {
      const shopName = row['쇼핑몰'] || row['판매처'] || '';
      const unitPrice = parseNumber(row['판매가'] || row['판매단가'] || row['상품가격']);
      const quantity = parseNumber(row['수량'] || row['주문수량']) || 1;
      const totalAmount = parseNumber(row['결제금액'] || row['총금액'] || row['주문금액'] || row['상품금액']) || unitPrice * quantity;
      const platformFee = parseNumber(row['수수료'] || row['판매수수료']);
      const shippingFee = parseNumber(row['배송비'] || row['배송비용']);

      return {
        orderId: row['쇼핑몰주문번호'] || row['사방넷주문번호'] || row['주문번호'] || '',
        orderDate: parseDate(row['주문일'] || row['주문일시'] || row['결제일'] || row['주문접수일']),
        productName: row['상품명'] || row['쇼핑몰상품명'] || '',
        optionName: row['옵션'] || row['옵션명'] || row['옵션정보'] || '',
        quantity,
        unitPrice,
        totalAmount,
        platformFee,
        shippingFee,
        settlementAmount: parseNumber(row['정산금액'] || row['정산예정금액']) || (totalAmount - platformFee),
        status: row['주문상태'] || row['배송상태'] || row['처리상태'] || '',
        channel: mapChannelName(shopName),
      };
    }).filter(row => row.productName);
  },

  parseSettlements(data: Record<string, string>[]): MarketSettlementRow[] {
    return data.map(row => {
      const shopName = row['쇼핑몰'] || row['판매처'] || '';
      const saleAmount = parseNumber(row['판매금액'] || row['결제금액'] || row['판매가'] || row['상품금액']);
      const platformFee = parseNumber(row['수수료'] || row['판매수수료']);
      const shippingFee = parseNumber(row['배송비'] || row['배송비용']);
      const returnAmount = parseNumber(row['환불금액'] || row['반품금액'] || row['취소금액']);
      const adjustmentAmount = parseNumber(row['조정금액'] || row['기타금액']);

      return {
        settlementDate: parseDate(row['정산일'] || row['정산완료일'] || row['입금일']),
        productName: row['상품명'] || row['쇼핑몰상품명'] || '',
        orderId: row['쇼핑몰주문번호'] || row['사방넷주문번호'] || row['주문번호'] || '',
        saleAmount,
        platformFee,
        shippingFee,
        returnAmount,
        adjustmentAmount,
        settlementAmount: parseNumber(row['정산금액'] || row['정산예정금액']) || (saleAmount - platformFee - shippingFee - returnAmount + adjustmentAmount),
        channel: mapChannelName(shopName),
      };
    }).filter(row => row.productName || row.saleAmount > 0);
  },
};
