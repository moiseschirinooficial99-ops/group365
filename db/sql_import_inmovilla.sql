-- ═══════════════════════════════════════════════════════
-- IMPORTACIÓN DE PROPIEDADES DESDE INMOVILLA (eXp / agencia 8930)
-- Ejecutar en Supabase → SQL Editor ANTES de correr
-- scripts/import-inmovilla.mjs
-- ═══════════════════════════════════════════════════════

-- Referencia externa de Inmovilla (ej: EXP15603).
-- Es la clave con la que el importador hace upsert: si vuelves a
-- importar, actualiza la propiedad en vez de duplicarla.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

-- Origen del dato, para distinguir lo importado de lo cargado a mano.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Ubicación desglosada (el feed la trae separada).
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS province TEXT;

-- Agente de eXp que tiene la propiedad. Sirve para el flujo de
-- operación compartida: cuando entra un lead por una propiedad que no
-- es de Group 360, hay que llamar a este agente para coordinar la visita.
-- USO INTERNO: no mostrar en la web pública.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agent_name TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agent_email TEXT;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS agent_phone TEXT;

-- Fecha de la última importación, para detectar fichas obsoletas.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Integridad: dos propiedades no pueden compartir referencia de Inmovilla.
-- Índice parcial, para que las propiedades cargadas a mano (external_ref
-- NULL) no choquen entre sí.
--
-- OJO: al ser parcial, Postgres NO lo acepta en un "ON CONFLICT
-- (external_ref)" normal. Por eso scripts/import-inmovilla.mjs no usa
-- ON CONFLICT sobre esta columna: primero consulta qué referencias ya
-- existen y luego separa altas (insert) de actualizaciones (upsert por id).
CREATE UNIQUE INDEX IF NOT EXISTS properties_external_ref_key
  ON public.properties (external_ref)
  WHERE external_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_province ON public.properties (province);
CREATE INDEX IF NOT EXISTS idx_properties_source   ON public.properties (source);
