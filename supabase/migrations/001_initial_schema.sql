-- 쇼핑몰 수익 관리 시스템 초기 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블 (사용자 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. products 테이블 (상품)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  base_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. product_markets 테이블 (상품별 마켓 설정)
CREATE TABLE IF NOT EXISTS public.product_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  sub_option_id TEXT,
  selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  platform_fee_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  payment_fee_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  additional_costs JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, channel, sub_option_id)
);

-- 4. platform_settings 테이블 (사용자별 플랫폼 설정)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  custom_presets JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_product_markets_product_id ON public.product_markets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_markets_channel ON public.product_markets(channel);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- profiles RLS 정책
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- products RLS 정책
CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- product_markets RLS 정책
CREATE POLICY "Users can view own product markets" ON public.product_markets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_markets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product markets" ON public.product_markets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_markets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own product markets" ON public.product_markets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_markets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own product markets" ON public.product_markets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_markets.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- platform_settings RLS 정책
CREATE POLICY "Users can view own platform settings" ON public.platform_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platform settings" ON public.platform_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platform settings" ON public.platform_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 트리거: 새 사용자 가입 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_markets_updated_at
  BEFORE UPDATE ON public.product_markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
