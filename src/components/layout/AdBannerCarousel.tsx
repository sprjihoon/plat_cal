'use client';

import { useState, useEffect, useCallback } from 'react';

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

export function AdBannerCarousel({ banners }: { banners: AdBanner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [banners.length, paused, next]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  const content = (
    <div
      className="w-full py-5 md:py-6 px-4 transition-all duration-500 ease-in-out"
      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-4xl mx-auto text-center space-y-1.5">
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt=""
            className="max-h-10 mx-auto mb-2 object-contain rounded"
          />
        )}
        {banner.subtitle && (
          <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium opacity-50">
            {banner.subtitle}
          </p>
        )}
        <h2 className="text-base md:text-lg lg:text-xl font-bold tracking-tight">
          {banner.title}
          {banner.highlight && (
            <>
              {' '}
              <span style={{ color: banner.highlight_color }}>{banner.highlight}</span>
            </>
          )}
        </h2>
        <div className="flex items-center justify-center gap-3 pt-1">
          {banner.link_url && (
            <span className="text-[10px] md:text-xs opacity-40">
              {banner.link_url.replace(/^https?:\/\//, '')}
            </span>
          )}
          {banners.length > 1 && (
            <div className="flex items-center gap-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: banner.text_color,
                    opacity: i === current ? 0.8 : 0.25,
                    transform: i === current ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`배너 ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        {content}
      </a>
    );
  }

  return content;
}
