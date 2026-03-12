export interface MarketOrderRow {
  orderId: string;
  orderDate: string;
  productName: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  platformFee: number;
  shippingFee: number;
  settlementAmount: number;
  status: string;
  channel: string;
}

export interface MarketSettlementRow {
  settlementDate: string;
  productName: string;
  orderId: string;
  saleAmount: number;
  platformFee: number;
  shippingFee: number;
  returnAmount: number;
  adjustmentAmount: number;
  settlementAmount: number;
  channel: string;
}

export interface ParsedMarketData {
  orders: MarketOrderRow[];
  settlements: MarketSettlementRow[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalFees: number;
    totalSettlement: number;
    period: { start: string; end: string };
  };
  warnings: string[];
  marketName: string;
}

export interface MarketParser {
  name: string;
  channel: string;
  detect(headers: string[]): boolean;
  parseOrders(data: Record<string, string>[]): MarketOrderRow[];
  parseSettlements(data: Record<string, string>[]): MarketSettlementRow[];
}
