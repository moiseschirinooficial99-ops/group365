-- ═══════════════════════════════════════════════════════════════
-- BLOQUE 2: Suscriptores de avisos de oportunidades por WhatsApp
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
-- Lista ligera de personas que piden por WhatsApp que se les avise
-- de nuevas oportunidades, SIN tener que registrarse en la web.
-- El bot de WhatsApp inserta aquí; notifyInvestors.ts hace broadcast.

CREATE TABLE IF NOT EXISTS public.investor_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  -- 'registered' = ya está en investors_private / profiles
  -- 'whatsapp'   = se suscribió sólo por WhatsApp
  source TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_notified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_investor_subscribers_active
  ON public.investor_subscribers (is_active);

-- Solo la API (service role) accede a esta tabla
ALTER TABLE public.investor_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access subscribers"
  ON public.investor_subscribers
  FOR ALL
  USING (true)
  WITH CHECK (true);
