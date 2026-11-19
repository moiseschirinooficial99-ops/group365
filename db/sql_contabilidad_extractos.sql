-- ═══════════════════════════════════════════════════════
-- CONTABILIDAD: extractos bancarios + quién sube cada documento
--
-- 1. accounting_documents: quién lo subió y saldos del extracto.
-- 2. movimientos_bancarios: una fila por línea del extracto (fecha, concepto,
--    importe con signo, saldo). Se borran solos al borrar el extracto.
--
-- Hacer ANTES un volcado de la base (regla de migraciones).
-- EJECUTAR en Supabase → SQL Editor. Es idempotente (se puede repetir).
-- ═══════════════════════════════════════════════════════

-- ── 1. Documentos: quién sube y saldos del extracto ─────
ALTER TABLE accounting_documents ADD COLUMN IF NOT EXISTS subido_por   TEXT;   -- Moisés | José Luis | Telegram
ALTER TABLE accounting_documents ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC(12,2);
ALTER TABLE accounting_documents ADD COLUMN IF NOT EXISTS saldo_final   NUMERIC(12,2);

-- ── 2. Movimientos bancarios ────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_bancarios (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id  UUID NOT NULL REFERENCES accounting_documents(id) ON DELETE CASCADE,
  fecha        DATE,
  concepto     TEXT,
  importe      NUMERIC(12,2) NOT NULL,   -- positivo = entra, negativo = sale
  saldo        NUMERIC(12,2),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_bancarios(fecha);
CREATE INDEX IF NOT EXISTS idx_mov_document ON movimientos_bancarios(document_id);

-- Sin políticas públicas: solo el service role (servidor) lee y escribe.
ALTER TABLE movimientos_bancarios ENABLE ROW LEVEL SECURITY;
