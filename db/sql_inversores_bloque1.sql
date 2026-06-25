-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 1: Tablas de oportunidades de inversión + notificaciones
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Tabla general de oportunidades
CREATE TABLE IF NOT EXISTS public.investment_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  -- valores: 'npl', 'reo', 'cesion_remate', 'producto_ocupado', 'fondo'
  title TEXT NOT NULL,
  location TEXT,
  description TEXT,
  debt_value DECIMAL(12,2),
  offer_price DECIMAL(12,2),
  property_value DECIMAL(12,2),
  roi_estimated DECIMAL(5,2),
  annual_return_pct DECIMAL(5,2),
  judicial_phase TEXT,
  occupancy_status TEXT,
  minimum_investment DECIMAL(12,2),
  estimated_timeline TEXT,
  status TEXT DEFAULT 'disponible',
  is_public BOOLEAN DEFAULT true,
  images TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de notificaciones a inversores
CREATE TABLE IF NOT EXISTS public.investor_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES investment_opportunities(id),
  investor_id UUID REFERENCES investors_private(id),
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'sent'
);

-- 3. Si tienes datos en npl_portfolio de sesión anterior, migrar:
-- INSERT INTO investment_opportunities (category, title, location, description, debt_value, offer_price, property_value, roi_estimated, status, is_public, created_at)
-- SELECT 'npl', title, location, description, debt_value, offer_price, property_value, roi_estimated, status, true, created_at
-- FROM npl_portfolio
-- WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'npl_portfolio') IS NOT NULL;

-- RLS: permitir lectura pública de oportunidades públicas
ALTER TABLE public.investment_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read available opportunities"
  ON public.investment_opportunities
  FOR SELECT
  USING (is_public = true AND status = 'disponible');

-- Permitir que service role lea/escriba todo (para la API)
CREATE POLICY "Service role full access"
  ON public.investment_opportunities
  FOR ALL
  USING (true)
  WITH CHECK (true);
