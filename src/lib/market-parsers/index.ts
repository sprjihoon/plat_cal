import { MarketParser, ParsedMarketData } from './types';
import { coupangParser } from './coupang';
import { smartstoreParser } from './smartstore';
import { elevenstParser } from './elevenst';
import { gmarketParser } from './gmarket';
import { zigzagParser } from './zigzag';
import { ablyParser } from './ably';
import { ezadminParser } from './ezadmin';
import { sellmateParser } from './sellmate';
import { sabangnetParser } from './sabangnet';

export type { MarketParser, MarketOrderRow, MarketSettlementRow, ParsedMarketData } from './types';

const marketParsers: MarketParser[] = [
  coupangParser,
  smartstoreParser,
  elevenstParser,
  gmarketParser,
  zigzagParser,
  ablyParser,
];

const solutionParsers: MarketParser[] = [
  ezadminParser,
  sellmateParser,
  sabangnetParser,
];

const parsers: MarketParser[] = [
  ...solutionParsers,
  ...marketParsers,
];

export function detectMarket(headers: string[]): MarketParser | null {
  for (const parser of parsers) {
    if (parser.detect(headers)) {
      return parser;
    }
  }
  return null;
}

export function getAvailableMarkets(): { name: string; channel: string; isSolution?: boolean }[] {
  return [
    ...marketParsers.map(p => ({ name: p.name, channel: p.channel })),
    ...solutionParsers.map(p => ({ name: p.name, channel: p.channel, isSolution: true })),
  ];
}

export function getParserByChannel(channel: string): MarketParser | null {
  return parsers.find(p => p.channel === channel) || null;
}

export function parseMarketData(
  data: Record<string, string>[],
  headers: string[],
  forceChannel?: string
): ParsedMarketData {
  const warnings: string[] = [];

  let parser: MarketParser | null = null;
  if (forceChannel) {
    parser = getParserByChannel(forceChannel);
    if (!parser) {
      warnings.push(`지정된 마켓(${forceChannel})의 파서를 찾을 수 없습니다.`);
    }
  } else {
    parser = detectMarket(headers);
    if (!parser) {
      warnings.push('마켓을 자동 감지할 수 없습니다. 마켓을 직접 선택해주세요.');
    }
  }

  if (!parser) {
    return {
      orders: [],
      settlements: [],
      summary: {
        totalOrders: 0,
        totalRevenue: 0,
        totalFees: 0,
        totalSettlement: 0,
        period: { start: '', end: '' },
      },
      warnings,
      marketName: '알 수 없음',
    };
  }

  const orders = parser.parseOrders(data);
  const settlements = parser.parseSettlements(data);

  const allDates = [
    ...orders.map(o => o.orderDate),
    ...settlements.map(s => s.settlementDate),
  ].filter(d => d).sort();

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0) ||
                       settlements.reduce((sum, s) => sum + s.saleAmount, 0);
  const totalFees = orders.reduce((sum, o) => sum + o.platformFee, 0) ||
                    settlements.reduce((sum, s) => sum + s.platformFee, 0);
  const totalSettlement = orders.reduce((sum, o) => sum + o.settlementAmount, 0) ||
                          settlements.reduce((sum, s) => sum + s.settlementAmount, 0);

  if (orders.length === 0 && settlements.length === 0) {
    warnings.push('파싱된 데이터가 없습니다. 파일 형식을 확인해주세요.');
  }

  return {
    orders,
    settlements,
    summary: {
      totalOrders: orders.length || settlements.length,
      totalRevenue,
      totalFees,
      totalSettlement,
      period: {
        start: allDates[0] || '',
        end: allDates[allDates.length - 1] || '',
      },
    },
    warnings,
    marketName: parser.name,
  };
}
