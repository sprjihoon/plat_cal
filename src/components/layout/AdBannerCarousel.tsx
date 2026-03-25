'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  slide_interval?: number;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('ad_session_id');
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('ad_session_id', sid);
  }
  return sid;
}

function trackAdEvent(bannerId: string, eventType: 'click' | 'impression') {
  const body = {
    banner_id: bannerId,
    event_type: eventType,
    page_path: window.location.pathname,
    session_id: getSessionId(),
  };
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/ads/track', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  } else {
    fetch('/api/ads/track', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  }
}

const SWIPE_THRESHOLD = 40;
const DEFAULT_INTERVAL = 4000;

export function AdBannerCarousel({ banners }: { banners: AdBanner[] }) {
  const autoInterval = banners[0]?.slide_interval || DEFAULT_INTERVAL;
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  const trackedImpressions = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; time: number } | null>(null);
  const hasDragged = useRef(false);

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % banners.length) + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-slide
  useEffect(() => {
    if (banners.length <= 1 || paused || isDragging) return;
    const timer = setInterval(() => goTo(current + 1), autoInterval);
    return () => clearInterval(timer);
  }, [banners.length, paused, isDragging, current, goTo, autoInterval]);

  // Impression tracking
  useEffect(() => {
    if (banners.length === 0) return;
    const banner = banners[current];
    if (!trackedImpressions.current.has(banner.id)) {
      trackedImpressions.current.add(banner.id);
      trackAdEvent(banner.id, 'impression');
    }
  }, [current, banners]);

  const handleDragStart = (clientX: number) => {
    dragStart.current = { x: clientX, time: Date.now() };
    hasDragged.current = false;
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    if (!dragStart.current) return;
    const diff = clientX - dragStart.current.x;
    if (Math.abs(diff) > 5) hasDragged.current = true;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!dragStart.current) return;
    const velocity = Math.abs(dragOffset) / (Date.now() - dragStart.current.time + 1);
    const shouldSwipe = Math.abs(dragOffset) > SWIPE_THRESHOLD || velocity > 0.3;

    if (shouldSwipe && banners.length > 1) {
      if (dragOffset < 0) goTo(current + 1);
      else goTo(current - 1);
    }

    dragStart.current = null;
    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => { if (isDragging) handleDragMove(e.clientX); };
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { if (isDragging) handleDragEnd(); setPaused(false); };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => { handleDragStart(e.touches[0].clientX); };
  const onTouchMove = (e: React.TouchEvent) => { handleDragMove(e.touches[0].clientX); };
  const onTouchEnd = () => handleDragEnd();

  if (banners.length === 0) return null;

  const banner = banners[current];

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      return;
    }
    trackAdEvent(banner.id, 'click');
  };

  const renderSlide = (b: AdBanner) => (
    <div
      className="w-full shrink-0 py-5 md:py-6 px-4"
      style={{ backgroundColor: b.bg_color, color: b.text_color }}
    >
      <div className="max-w-4xl mx-auto text-center space-y-1.5">
        {b.image_url && (
          <img src={b.image_url} alt="" className="max-h-10 mx-auto mb-2 object-contain rounded" draggable={false} />
        )}
        {b.subtitle && (
          <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium opacity-50">
            {b.subtitle}
          </p>
        )}
        <h2 className="text-base md:text-lg lg:text-xl font-bold tracking-tight">
          {b.title}
          {b.highlight && (
            <> <span style={{ color: b.highlight_color }}>{b.highlight}</span></>
          )}
        </h2>
        <div className="flex items-center justify-center gap-3 pt-1">
          {b.link_url && (
            <span className="text-[10px] md:text-xs opacity-40">
              {b.link_url.replace(/^https?:\/\//, '')}
            </span>
          )}
          {banners.length > 1 && (
            <div className="flex items-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: b.text_color,
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

  const slideContent = (
    <div
      ref={containerRef}
      className="overflow-hidden select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => setPaused(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div
        className="flex"
        style={{
          transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {banners.map((b) => renderSlide(b))}
      </div>
    </div>
  );

  if (banner.link_url) {
    return (
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleClick}
        draggable={false}
      >
        {slideContent}
      </a>
    );
  }

  return <div onClick={handleClick}>{slideContent}</div>;
}
