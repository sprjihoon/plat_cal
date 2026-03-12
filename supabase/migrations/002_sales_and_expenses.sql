-- 판매 기록 및 비용 관리 테이블
-- Supabase SQL Editor에서 실행하세요

-- 1. sales_records 테이블 (일일 판매 기록)
CREATE TABLE IF NOT EXISTS public.sales_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  product_market_id UUID REFERENCES public.product_markets(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_revenue DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  payment_fee DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. advertising_costs 테이블 (광고비 기록)
CREATE TABLE IF NOT EXISTS public.advertising_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL,
  ad_date DATE NOT NULL,
  cost DECIMAL(12, 2) NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ad_type TEXT,
  campaign_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. operating_expenses 테이블 (운영비 기록)
CREATE TABLE IF NOT EXISTS public.operating_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON public.sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_sale_date ON public.sales_records(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_records_product_id ON public.sales_records(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_channel ON public.sales_records(channel);

CREATE INDEX IF NOT EXISTS idx_advertising_costs_user_id ON public.advertising_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_advertising_costs_ad_date ON public.advertising_costs(ad_date);
CREATE INDEX IF NOT EXISTS idx_advertising_costs_channel ON public.advertising_costs(channel);

CREATE INDEX IF NOT EXISTS idx_operating_expenses_user_id ON public.operating_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_expense_date ON public.operating_expenses(expense_date);

-- RLS 활성화
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertising_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_expenses ENABLE ROW LEVEL SECURITY;

-- sales_records RLS 정책
CREATE POLICY "Users can view own sales records" ON public.sales_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales records" ON public.sales_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales records" ON public.sales_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales records" ON public.sales_records
  FOR DELETE USING (auth.uid() = user_id);

-- advertising_costs RLS 정책
CREATE POLICY "Users can view own advertising costs" ON public.advertising_costs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advertising costs" ON public.advertising_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advertising costs" ON public.advertising_costs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own advertising costs" ON public.advertising_costs
  FOR DELETE USING (auth.uid() = user_id);

-- operating_expenses RLS 정책
CREATE POLICY "Users can view own operating expenses" ON public.operating_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own operating expenses" ON public.operating_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own operating expenses" ON public.operating_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own operating expenses" ON public.operating_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER update_sales_records_updated_at
  BEFORE UPDATE ON public.sales_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advertising_costs_updated_at
  BEFORE UPDATE ON public.advertising_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operating_expenses_updated_at
  BEFORE UPDATE ON public.operating_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
