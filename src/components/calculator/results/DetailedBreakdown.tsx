'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/calculator';
import type { CalculationResult } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DetailedBreakdownProps {
  result: CalculationResult | null;
  isValid: boolean;
}

interface BreakdownItemProps {
  label: string;
  value: number;
  isSubtraction?: boolean;
  isTotal?: boolean;
}

function BreakdownItem({ label, value, isSubtraction, isTotal }: BreakdownItemProps) {
  return (
    <div className={`flex justify-between items-center py-1.5 ${isTotal ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${isTotal ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm ${isSubtraction ? 'text-red-600' : ''} ${isTotal ? 'text-foreground' : ''}`}>
        {isSubtraction && value > 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function DetailedBreakdown({ result, isValid }: DetailedBreakdownProps) {
  if (!result || !isValid) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">상세 계산 내역</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion defaultValue={[0]}>
          <AccordionItem className="border-none">
            <AccordionTrigger className="py-2 text-sm hover:no-underline">
              내역 펼치기
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {/* 수입 */}
                <div className="pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    수입
                  </p>
                  <BreakdownItem label="실제 판매가" value={result.actualSellingPrice} />
                  <BreakdownItem label="총 유입 금액" value={result.totalIncome} isTotal />
                </div>

                <Separator />

                {/* 비용 */}
                <div className="py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    비용
                  </p>
                  <BreakdownItem label="상품 원가 (공급가)" value={result.productCostSupply} isSubtraction />
                  <BreakdownItem label="플랫폼 수수료" value={result.platformFee} isSubtraction />
                  <BreakdownItem label="결제 수수료" value={result.paymentFee} isSubtraction />
                  <BreakdownItem label="납부부가세" value={result.vatPayable} isSubtraction />
                  <BreakdownItem label="배송비 (판매자 부담)" value={result.shippingCost} isSubtraction />
                  <BreakdownItem label="포장 및 부자재비" value={result.packagingAndMaterialCost} isSubtraction />
                  <BreakdownItem label="광고비" value={result.advertisingCost} isSubtraction />
                  <BreakdownItem label="기타 비용" value={result.otherCosts} isSubtraction />
                </div>

                <Separator />

                {/* 부가세 상세 */}
                <div className="py-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    부가세 상세
                  </p>
                  <BreakdownItem label="매출부가세" value={result.salesVat} />
                  <BreakdownItem label="매입부가세 (원가+비용 VAT)" value={result.totalPurchaseVat} isSubtraction />
                  <BreakdownItem label="납부부가세" value={result.vatPayable} isTotal />
                </div>

                <Separator />

                {/* 합계 */}
                <div className="pt-2">
                  <BreakdownItem label="총 차감 비용" value={result.totalDeductions} isTotal />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
