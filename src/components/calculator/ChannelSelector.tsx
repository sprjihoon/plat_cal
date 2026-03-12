'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PLATFORM_OPTIONS } from '@/constants';
import type { SalesChannel } from '@/types';

interface ChannelSelectorProps {
  value: SalesChannel;
  onChange: (value: SalesChannel) => void;
}

export function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">판매 채널 선택</Label>
      <Select value={value} onValueChange={(v) => onChange(v as SalesChannel)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="판매 채널을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {PLATFORM_OPTIONS.map((platform) => (
            <SelectItem key={platform.id} value={platform.id}>
              {platform.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        선택한 채널의 기본 수수료율이 자동 입력됩니다. 필요하면 직접 수정할 수 있어요.
      </p>
    </div>
  );
}
