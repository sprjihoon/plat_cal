'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXAMPLE_PRESETS } from '@/constants';
import type { ExamplePreset } from '@/types';
import { RotateCcw, FileDown } from 'lucide-react';

interface ExampleSelectorProps {
  onSelectExample: (preset: ExamplePreset) => void;
  onReset: () => void;
}

export function ExampleSelector({ onSelectExample, onReset }: ExampleSelectorProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(undefined);

  const handleValueChange = (value: string | null) => {
    if (!value) return;
    setSelectedValue(value);
    const preset = EXAMPLE_PRESETS.find((p) => p.id === value);
    if (preset) {
      onSelectExample(preset);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={selectedValue} onValueChange={(v) => handleValueChange(v)}>
        <SelectTrigger className="flex-1">
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            <SelectValue placeholder="예시값 불러오기" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {EXAMPLE_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex flex-col">
                <span>{preset.name}</span>
                <span className="text-xs text-muted-foreground">
                  {preset.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onReset} className="shrink-0">
        <RotateCcw className="h-4 w-4 mr-2" />
        초기화
      </Button>
    </div>
  );
}
