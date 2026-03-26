import { createClient } from '@/lib/supabase/server';
import { AdBannerCarousel } from './AdBannerCarousel';
import { FooterInfo } from './FooterInfo';

export async function getAdBanners() {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('ad_banners')
      .select('id,title,subtitle,highlight,link_url,image_url,bg_color,text_color,highlight_color,slide_interval')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('[AdBanners] Supabase error:', error.message, error.code);
    }
    return data || [];
  } catch (e) {
    console.error('[AdBanners] Exception:', e);
    return [];
  }
}

export async function Footer() {
  const banners = await getAdBanners();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      {banners.length > 0 && <AdBannerCarousel banners={banners} />}
      <FooterInfo />
    </footer>
  );
}
