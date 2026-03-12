import type { PlatformPreset, SalesChannel } from '@/types';

/**
 * 플랫폼별 수수료 프리셋 (2025-2026 최신 기준)
 * 
 * 참고: 수수료는 정책 변경에 따라 달라질 수 있습니다.
 * - 스마트스토어: 2025년 6월 개편 기준
 * - 결제수수료: 매출 등급별 차등 (여기서는 일반 등급 기준)
 */
export const PLATFORM_PRESETS: Record<SalesChannel, PlatformPreset> = {
  smartstore: {
    id: 'smartstore',
    name: '스마트스토어',
    platformFeeRate: 3.0,
    paymentFeeRate: 3.63,
    subOptions: [
      {
        id: 'smartstore_general',
        name: '일반 거래',
        description: '네이버쇼핑 검색/추천 유입 (VAT별도 2.73% + 결제 3.63%)',
        platformFeeRate: 3.0,
        paymentFeeRate: 3.63,
      },
      {
        id: 'smartstore_direct',
        name: '직접 유입',
        description: '판매자 마케팅 링크/SNS 유입 (VAT별도 0.91% + 결제 3.63%)',
        platformFeeRate: 1.0,
        paymentFeeRate: 3.63,
      },
      {
        id: 'smartstore_brand',
        name: '브랜드스토어',
        description: '브랜드스토어 입점 (VAT별도 3.64% + 결제 3.63%)',
        platformFeeRate: 4.0,
        paymentFeeRate: 3.63,
      },
      {
        id: 'smartstore_small',
        name: '영세사업자',
        description: '연매출 3억 이하 (VAT별도 2.73% + 결제 1.95%)',
        platformFeeRate: 3.0,
        paymentFeeRate: 1.95,
      },
    ],
  },
  own_mall: {
    id: 'own_mall',
    name: '자사몰',
    platformFeeRate: 0,
    paymentFeeRate: 3.2,
    subOptions: [
      {
        id: 'own_mall_pg_general',
        name: 'PG사 (일반)',
        description: '연매출 30억 이상 기준',
        platformFeeRate: 0,
        paymentFeeRate: 3.2,
      },
      {
        id: 'own_mall_pg_small',
        name: 'PG사 (영세)',
        description: '연매출 3억 이하 (토스페이먼츠 기준)',
        platformFeeRate: 0,
        paymentFeeRate: 1.65,
      },
      {
        id: 'own_mall_naverpay',
        name: '네이버페이',
        description: '네이버페이 결제 연동 시',
        platformFeeRate: 0,
        paymentFeeRate: 2.8,
      },
      {
        id: 'own_mall_kakaopay',
        name: '카카오페이',
        description: '카카오페이 결제 연동 시',
        platformFeeRate: 0,
        paymentFeeRate: 3.0,
      },
      {
        id: 'own_mall_tosspay',
        name: '토스페이',
        description: '토스페이 결제 연동 시',
        platformFeeRate: 0,
        paymentFeeRate: 3.5,
      },
    ],
  },
  ably: {
    id: 'ably',
    name: '에이블리',
    platformFeeRate: 3,
    paymentFeeRate: 3.96,
    subOptions: [
      {
        id: 'ably_sellers',
        name: '에이블리 셀러스',
        description: '일반 셀러 (플랫폼 3% + 결제 3.96%, VAT별도)',
        platformFeeRate: 3.3,
        paymentFeeRate: 4.36,
      },
      {
        id: 'ably_partners',
        name: '에이블리 파트너스',
        description: '위탁판매/풀필먼트 (수수료 포함)',
        platformFeeRate: 20,
        paymentFeeRate: 0,
      },
    ],
  },
  zigzag: {
    id: 'zigzag',
    name: '지그재그',
    platformFeeRate: 8.5,
    paymentFeeRate: 0,
    subOptions: [
      {
        id: 'zigzag_soho',
        name: '소호 (사입)',
        description: '사입 방식 의류 판매',
        platformFeeRate: 8.5,
        paymentFeeRate: 0,
      },
      {
        id: 'zigzag_brand',
        name: '브랜드',
        description: '브랜드 입점 (자사몰 방식)',
        platformFeeRate: 27,
        paymentFeeRate: 0,
      },
      {
        id: 'zigzag_beauty',
        name: '뷰티/키즈',
        description: '뷰티, 키즈 카테고리',
        platformFeeRate: 27,
        paymentFeeRate: 0,
      },
      {
        id: 'zigzag_life',
        name: '라이프',
        description: '라이프 카테고리',
        platformFeeRate: 18,
        paymentFeeRate: 0,
      },
      {
        id: 'zigzag_food',
        name: '푸드',
        description: '푸드 카테고리',
        platformFeeRate: 15,
        paymentFeeRate: 0,
      },
    ],
  },
  coupang: {
    id: 'coupang',
    name: '쿠팡',
    platformFeeRate: 10.8,
    paymentFeeRate: 0,
    subOptions: [
      {
        id: 'coupang_fashion',
        name: '패션/의류',
        description: '의류, 신발, 가방, 잡화',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
      {
        id: 'coupang_beauty',
        name: '뷰티',
        description: '화장품, 스킨케어, 헤어케어',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
      {
        id: 'coupang_electronics',
        name: '가전/디지털',
        description: '전자제품, 컴퓨터, 모바일',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
      {
        id: 'coupang_home',
        name: '홈/리빙',
        description: '가구, 생활용품, 주방용품',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
      {
        id: 'coupang_food',
        name: '식품',
        description: '식품, 건강식품, 신선식품',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
      {
        id: 'coupang_baby',
        name: '출산/유아동',
        description: '유아용품, 아동복, 완구',
        platformFeeRate: 10.8,
        paymentFeeRate: 0,
      },
    ],
  },
  open_market: {
    id: 'open_market',
    name: '오픈마켓',
    platformFeeRate: 12,
    paymentFeeRate: 0,
    subOptions: [
      {
        id: 'gmarket_fashion',
        name: 'G마켓 (패션/뷰티)',
        description: '의류, 화장품, 쥬얼리, 시계',
        platformFeeRate: 13,
        paymentFeeRate: 0,
      },
      {
        id: 'gmarket_general',
        name: 'G마켓 (일반)',
        description: '생활용품, 가전 등',
        platformFeeRate: 12,
        paymentFeeRate: 0,
      },
      {
        id: 'gmarket_digital',
        name: 'G마켓 (디지털)',
        description: '컴퓨터, USB, 주변기기',
        platformFeeRate: 5,
        paymentFeeRate: 0,
      },
      {
        id: 'auction_fashion',
        name: '옥션 (패션/뷰티)',
        description: '의류, 화장품, 쥬얼리, 시계',
        platformFeeRate: 13,
        paymentFeeRate: 0,
      },
      {
        id: 'auction_general',
        name: '옥션 (일반)',
        description: '생활용품, 가전 등',
        platformFeeRate: 12,
        paymentFeeRate: 0,
      },
      {
        id: '11st_general',
        name: '11번가 (일반)',
        description: '일반 카테고리',
        platformFeeRate: 12,
        paymentFeeRate: 0,
      },
      {
        id: '11st_new_seller',
        name: '11번가 (신규셀러)',
        description: '신규 셀러 1년간 프로모션',
        platformFeeRate: 6,
        paymentFeeRate: 0,
      },
    ],
  },
  custom: {
    id: 'custom',
    name: '직접입력',
    platformFeeRate: 0,
    paymentFeeRate: 0,
  },
};

export const PLATFORM_OPTIONS = Object.values(PLATFORM_PRESETS);
