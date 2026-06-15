-- ═══════════════════════════════════════════════════════
-- MIGRATION: Estados de propiedades + Calendario alquileres
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════

-- 1. Añadir columnas de estado a properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponible',
ADD COLUMN IF NOT EXISTS sold_date DATE,
ADD COLUMN IF NOT EXISTS sold_price DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS reserved_by TEXT,
ADD COLUMN IF NOT EXISTS price_high_season DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_low_season DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS min_nights INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS rental_notes TEXT,
ADD COLUMN IF NOT EXISTS is_success_case BOOLEAN DEFAULT false;

-- 2. Tabla de disponibilidad para alquileres vacacionales
CREATE TABLE IF NOT EXISTS public.rental_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  status TEXT DEFAULT 'blocked',
  guest_name TEXT,
  guest_phone TEXT,
  guest_email TEXT,
  total_price DECIMAL(10,2),
  platform TEXT DEFAULT 'directo',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS en rental_availability
ALTER TABLE public.rental_availability ENABLE ROW LEVEL SECURITY;

-- 4. Política para lectura pública del calendario
CREATE POLICY IF NOT EXISTS "rental_availability_public_read"
  ON public.rental_availability FOR SELECT USING (true);

-- 5. Política para escritura solo service_role
CREATE POLICY IF NOT EXISTS "rental_availability_service_write"
  ON public.rental_availability FOR ALL USING (auth.role() = 'service_role');

-- 6. Actualizar propiedades existentes con status por defecto
UPDATE public.properties SET status = 'disponible' WHERE status IS NULL;
