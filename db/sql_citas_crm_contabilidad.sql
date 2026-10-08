-- ═══════════════════════════════════════════════════════
-- CITAS + CRM (seguimiento) + CONTABILIDAD
--
-- 1. appointments: llamadas / visitas / videollamadas con José Luis.
--    agent_availability se mantiene para bloques de disponible/ocupado.
-- 2. leads: fecha del próximo seguimiento y del último contacto, para que el
--    CRM y los avisos de n8n sepan a quién hay que volver a escribir.
-- 3. accounting_documents: facturas, tickets, extractos e impuestos subidos
--    desde el panel o por Telegram, con los datos leídos por IA.
-- 4. Bucket privado "contabilidad" para los archivos (nunca público).
--
-- EJECUTAR en Supabase → SQL Editor. Es idempotente (se puede repetir).
-- ═══════════════════════════════════════════════════════

-- ── 1. Citas ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id       TEXT,          -- id del lead (sin FK: el tipo de leads.id no está versionado en el repo)
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  kind          TEXT NOT NULL DEFAULT 'llamada'
                CHECK (kind IN ('llamada', 'visita', 'videollamada', 'reunion')),
  starts_at     TIMESTAMPTZ NOT NULL,
  duration_min  INT NOT NULL DEFAULT 30,
  status        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente', 'confirmada', 'realizada', 'cancelada', 'no_show')),
  notes         TEXT,
  source        TEXT NOT NULL DEFAULT 'panel',   -- panel | telegram | whatsapp | web
  reminder_sent_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);

-- ── 2. CRM: seguimiento de leads ────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at   TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;

-- ── 3. Contabilidad ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounting_documents (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direction      TEXT NOT NULL DEFAULT 'gasto'
                 CHECK (direction IN ('gasto', 'ingreso', 'otro')),
  doc_type       TEXT NOT NULL DEFAULT 'factura',
                 -- factura | ticket | nomina | extracto | impuesto | contrato | otro
  issue_date     DATE,
  counterparty   TEXT,          -- proveedor (gasto) o cliente (ingreso)
  counterparty_nif TEXT,
  invoice_number TEXT,
  concept        TEXT,
  category       TEXT,          -- suministros, gestoría, marketing, comisiones…
  base_amount    NUMERIC(12,2),
  vat_rate       NUMERIC(5,2),
  vat_amount     NUMERIC(12,2),
  irpf_rate      NUMERIC(5,2),
  irpf_amount    NUMERIC(12,2),
  total_amount   NUMERIC(12,2),
  currency       TEXT NOT NULL DEFAULT 'EUR',
  file_path      TEXT,          -- ruta dentro del bucket "contabilidad"
  file_name      TEXT,
  file_mime      TEXT,
  status         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'revisado', 'enviado_gestoria')),
  source         TEXT NOT NULL DEFAULT 'panel',   -- panel | telegram
  ai_confidence  TEXT,          -- alta | media | baja
  ai_notes       TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_issue_date ON accounting_documents(issue_date);
CREATE INDEX IF NOT EXISTS idx_accounting_status ON accounting_documents(status);

-- Sin políticas públicas: solo el service role (servidor) lee y escribe.
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_documents ENABLE ROW LEVEL SECURITY;

-- ── 4. Bucket privado para los archivos contables ───────
INSERT INTO storage.buckets (id, name, public)
VALUES ('contabilidad', 'contabilidad', false)
ON CONFLICT (id) DO UPDATE SET public = false;
