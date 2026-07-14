-- ═══════════════════════════════════════════════════════
-- MIGRACIÓN — Módulo de Contratos (GROUP 360 INICIATIVAS)
-- Proyecto Supabase: ersxtjcuctujcrgahsir
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS contratos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          TEXT NOT NULL,                    -- loi | compraventa | alquiler_vacacional | nda | inversion_spv
  datos_json    JSONB NOT NULL DEFAULT '{}',      -- campos variables editados por el admin
  estado        TEXT NOT NULL DEFAULT 'borrador', -- borrador | generado | enviado | firmado | error
  fecha         TIMESTAMPTZ NOT NULL DEFAULT now(),
  destinatario  TEXT,                             -- email del destinatario
  -- Extras operativos (no imprescindibles pero útiles para el historial)
  nombre_destinatario TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos (estado);
CREATE INDEX IF NOT EXISTS idx_contratos_tipo   ON contratos (tipo);
CREATE INDEX IF NOT EXISTS idx_contratos_fecha  ON contratos (fecha DESC);

-- Mantener updated_at al día
CREATE OR REPLACE FUNCTION set_contratos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contratos_updated_at ON contratos;
CREATE TRIGGER trg_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_contratos_updated_at();

-- RLS: solo el service_role (backend) accede. La web usa supabaseAdmin.
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
-- (Sin políticas públicas: el acceso se hace exclusivamente con la service_role key
--  desde las rutas /api/admin/* y desde el workflow de n8n.)
