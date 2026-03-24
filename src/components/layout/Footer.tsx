import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface AdBannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  highlight: string | null;
  link_url: string | null;
  image_url: string | null;
  bg_color: string;
  text_color: string;
  highlight_color: string;
  is_active: boolean;
  sort_order: number;
}

async function getAdBanners(): Promise<AdBannerRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await (supabase as any)
      .from('ad_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

function AdBannerCard({ banner }: { banner: AdBannerRow }) {
  const content = (
    <div
      className="w-full py-12 md:py-16 px-4 transition-opacity hover:opacity-90"
      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
    >
      <div className="max-w-4xl mx-auto text-center space-y-3">
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt=""
            className="max-h-24 mx-auto mb-4 object-contain rounded"
          />
        )}
        {banner.subtitle && (
          <p className="text-sm md:text-base tracking-[0.3em] uppercase font-medium opacity-50">
            {banner.subtitle}
          </p>
        )}
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">
          {banner.title}
          {banner.highlight && (
            <>
              {' '}
              <span style={{ color: banner.highlight_color }}>{banner.highlight}</span>
            </>
          )}
        </h2>
        {banner.link_url && (
          <p className="text-sm md:text-base pt-1 opacity-40">
            {banner.link_url.replace(/^https?:\/\//, '')}
          </p>
        )}
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

export async function Footer() {
  const banners = await getAdBanners();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      {banners.length > 0 && (
        <div className="divide-y divide-white/10">
          {banners.map((banner) => (
            <AdBannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-foreground/80">틸리언</span>
            <span>대표: 장지훈</span>
            <span>사업자등록번호: 766-55-00323</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>개인정보관리책임자: 장지훈</span>
            <span>연락처: 010-2723-9490</span>
            <a href="mailto:info@tillion.kr" className="hover:text-foreground transition-colors">문의: info@tillion.kr</a>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-border/50">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
          </div>
          <p className="text-muted-foreground/60 pt-1">
            &copy; {new Date().getFullYear()} 틸리언. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
