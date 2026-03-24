'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface AdBanner {
  id: string;
  title: string;
  subtitle: string | null;
  highlight: string | null;
  link_url: string | null;
  image_url: string | null;
  bg_color: string;
  text_color: string;
  highlight_color: string;
}

export function MobileAdBanner({ banners }: { banners: AdBanner[] }) {
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [banners.length, next]);

  if (banners.length === 0 || dismissed) return null;

  const banner = banners[current];

  const content = (
    <div
      className="flex items-center justify-between gap-2 px-4 py-3"
      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-tight">
          {banner.title}
          {banner.highlight && (
            <span style={{ color: banner.highlight_color }}> {banner.highlight}</span>
          )}
        </p>
        {banner.subtitle && (
          <p className="text-[9px] opacity-50 truncate mt-0.5">{banner.subtitle}</p>
        )}
      </div>
      {banners.length > 1 && (
        <div className="flex items-center gap-1 shrink-0">
          {banners.map((_, i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full transition-all"
              style={{
                backgroundColor: banner.text_color,
                opacity: i === current ? 0.8 : 0.25,
              }}
            />
          ))}
        </div>
      )}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
        className="shrink-0 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity"
        aria-label="광고 닫기"
      >
        <X className="h-3.5 w-3.5" style={{ color: banner.text_color }} />
      </button>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      {banner.link_url ? (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
