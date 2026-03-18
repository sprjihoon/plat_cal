'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CalculationResult } from '@/types';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationJudgmentProps {
  result: CalculationResult | null;
  isValid: boolean;
}

export function OperationJudgment({ result, isValid }: OperationJudgmentProps) {
  if (!result || !isValid) {
    return null;
  }

  const { level, message } = result.operationJudgment;

  const getIcon = () => {
    switch (level) {
      case 'stable':
        return <CheckCircle2 className="h-5 w-5 text-[#4a5abf]" />;
      case 'manageable':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'caution':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getBadgeVariant = () => {
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
  };

  const getLevelText = () => {
    switch (level) {
      case 'stable':
        return '안정';
      case 'manageable':
        return '양호';
      case 'caution':
        return '주의';
      case 'danger':
        return '위험';
    }
  };

  const getAlertClass = () => {
    switch (level) {
      case 'stable':
        return 'border-[#8C9EFF]/30 bg-[#8C9EFF]/10';
      case 'manageable':
        return 'border-blue-200 bg-blue-50';
      case 'caution':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          운영 판단
          <Badge variant={getBadgeVariant()}>{getLevelText()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className={cn(getAlertClass())}>
          {getIcon()}
          <AlertDescription className="ml-2">
            {message}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
