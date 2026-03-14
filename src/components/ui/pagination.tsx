'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const PAGE_SIZE_OPTIONS = [30, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSize) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const navBtn = (onClick: () => void, disabled: boolean, children: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      {onPageSizeChange && pageSize ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">표시</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              type="button"
              className={`h-7 px-3 text-xs font-medium rounded-full transition-all duration-200 ${
                pageSize === size
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => onPageSizeChange(size)}
            >
              {size}
            </button>
          ))}
          <span className="text-xs text-muted-foreground whitespace-nowrap">건</span>
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-0.5">
        {totalPages > 1 && (
          <>
            {navBtn(() => onPageChange(1), page === 1, <ChevronsLeft className="h-4 w-4" />)}
            {navBtn(() => onPageChange(page - 1), page === 1, <ChevronLeft className="h-4 w-4" />)}

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-muted-foreground text-xs">...</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`h-8 w-8 flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-200 ${
                    p === page
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </button>
              )
            )}

            {navBtn(() => onPageChange(page + 1), page === totalPages, <ChevronRight className="h-4 w-4" />)}
            {navBtn(() => onPageChange(totalPages), page === totalPages, <ChevronsRight className="h-4 w-4" />)}
          </>
        )}

        {total !== undefined && (
          <span className="ml-3 text-xs text-muted-foreground font-medium">
            총 {total.toLocaleString()}건
          </span>
        )}
      </div>
    </div>
  );
}
