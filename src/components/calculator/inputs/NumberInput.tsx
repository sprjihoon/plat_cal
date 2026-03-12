'use client';

import { forwardRef, useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInputValue, parseNumericInput } from '@/lib/calculator';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  suffix?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
  id?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      suffix,
      placeholder = '0',
      description,
      error,
      disabled,
      className,
      inputMode = 'numeric',
      id,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        // 숫자, 콤마, 소수점, 마이너스만 허용
        const cleaned = rawValue.replace(/[^\d,.-]/g, '');
        
        // 포맷팅 적용
        const formatted = formatInputValue(cleaned);
        onChange(formatted);
      },
      [onChange]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      onBlur?.();
    }, [onBlur]);

    return (
      <div className={cn('space-y-1.5', className)}>
        <Label
          className={cn(
            'text-sm font-medium',
            error && 'text-destructive'
          )}
        >
          {label}
        </Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type="text"
            inputMode={inputMode}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pr-10 text-right',
              error && 'border-destructive focus-visible:ring-destructive',
              suffix && 'pr-12'
            )}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';
