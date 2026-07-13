-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN — Columnas nuevas de properties (5 verticales)
-- Ejecutar en Supabase → SQL Editor
-- Soluciona: "Could not find the 'plot_m2' column of 'properties'"
-- ═══════════════════════════════════════════════════════

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS plot_m2           NUMERIC(10,2),   -- superficie de parcela
  ADD COLUMN IF NOT EXISTS price_per_night   NUMERIC(10,2),   -- alquiler: precio/noche
  ADD COLUMN IF NOT EXISTS price_high_season NUMERIC(10,2),   -- temporada alta
  ADD COLUMN IF NOT EXISTS price_mid_season  NUMERIC(10,2),   -- temporada media
  ADD COLUMN IF NOT EXISTS price_low_season  NUMERIC(10,2),   -- temporada baja
  ADD COLUMN IF NOT EXISTS min_nights        INT,             -- mínimo de noches
  ADD COLUMN IF NOT EXISTS yearly_rent       NUMERIC(12,2),   -- alquiler anual
  ADD COLUMN IF NOT EXISTS latitude          NUMERIC(10,7),   -- geolocalización
  ADD COLUMN IF NOT EXISTS longitude         NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS main_image        TEXT,            -- imagen principal
  ADD COLUMN IF NOT EXISTS features          TEXT[] DEFAULT '{}',  -- extras/servicios
  ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN DEFAULT false,-- destacada
  ADD COLUMN IF NOT EXISTS exp_property_id   TEXT,            -- id externo (portal)
  ADD COLUMN IF NOT EXISTS created_by        TEXT;            -- autor del alta
