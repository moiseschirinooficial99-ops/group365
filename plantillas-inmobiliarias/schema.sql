-- ═══════════════════════════════════════════════════════
-- SCHEMA SUPABASE — PLANTILLA INMOBILIARIA GROUP 360
-- Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Propiedades
CREATE TABLE IF NOT EXISTS properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2),
  location      TEXT,
  city          TEXT,
  zone          TEXT,
  bedrooms      INT,
  bathrooms     INT,
  area_sqm      NUMERIC(8,2),
  property_type TEXT DEFAULT 'apartment',  -- apartment | house | villa | commercial | land
  status        TEXT DEFAULT 'available',  -- available | reserved | sold
  channel       TEXT DEFAULT 'personal',   -- personal | bank | investor
  is_active     BOOLEAN DEFAULT true,
  estimated_roi NUMERIC(4,2),
  images        TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (compradores, inversores, newsletter)
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  type          TEXT DEFAULT 'buyer',  -- buyer | investor | seller | renter | newsletter
  source        TEXT DEFAULT 'web',   -- web | whatsapp | referral | instagram | tiktok
  budget        NUMERIC(12,2),
  message       TEXT,
  status        TEXT DEFAULT 'new',   -- new | contacted | qualified | converted | discarded
  property_id   UUID REFERENCES properties(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Portal inversores
CREATE TABLE IF NOT EXISTS investor_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  budget_min    NUMERIC(12,2) DEFAULT 50000,
  budget_max    NUMERIC(12,2) DEFAULT 300000,
  zones         TEXT[] DEFAULT '{}',
  roi_target    NUMERIC(4,2) DEFAULT 5.0,
  investment_type TEXT DEFAULT 'both', -- buy | rent | both
  verified      BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Conversaciones WhatsApp
CREATE TABLE IF NOT EXISTS wa_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL,
  message       TEXT NOT NULL,
  direction     TEXT NOT NULL,   -- inbound | outbound
  wa_message_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Disponibilidad agente
CREATE TABLE IF NOT EXISTS agent_availability (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_from     TIMESTAMPTZ NOT NULL,
  date_to       TIMESTAMPTZ NOT NULL,
  status        TEXT DEFAULT 'available',  -- available | busy | vacation
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de aplicación (tokens, flags)
CREATE TABLE IF NOT EXISTS app_settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

-- Alertas de propiedades para inversores
CREATE TABLE IF NOT EXISTS property_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id   UUID REFERENCES investor_profiles(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES properties(id) ON DELETE CASCADE,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  opened        BOOLEAN DEFAULT false
);

-- ─── ÍNDICES ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active, status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_phone ON wa_conversations(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user ON investor_profiles(user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Propiedades: lectura pública para propiedades activas
CREATE POLICY "public_read_active_properties" ON properties
  FOR SELECT USING (is_active = true);

-- Leads: insert público (formularios web), lectura solo admins
CREATE POLICY "public_insert_leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Disponibilidad agente: lectura pública
CREATE POLICY "public_read_availability" ON agent_availability
  FOR SELECT USING (true);

-- Inversores: cada usuario ve su propio perfil
CREATE POLICY "investor_own_profile" ON investor_profiles
  FOR ALL USING (auth.uid() = user_id);

-- WhatsApp: solo service role (API routes)
-- (No policy necesaria — se accede con SUPABASE_SERVICE_ROLE_KEY)

-- app_settings: solo service role
-- (No policy necesaria — se accede con SUPABASE_SERVICE_ROLE_KEY)

-- ─── DATOS DE EJEMPLO ───────────────────────────────────
INSERT INTO properties (title, price, location, city, zone, bedrooms, bathrooms, area_sqm, property_type, channel, estimated_roi, description)
VALUES
  ('Apartamento Premium Centro', 185000, 'Calle Mayor 12', 'Madrid', 'Centro', 2, 1, 75, 'apartment', 'personal', 5.2, 'Reformado totalmente. A 5 minutos del metro. Ideal inversión.'),
  ('Villa con Piscina Costa del Sol', 450000, 'Urb. Las Palmeras 3', 'Marbella', 'Este', 4, 3, 280, 'villa', 'personal', 6.1, 'Villa independiente con piscina privada y vistas al mar.'),
  ('Piso Banco — Oportunidad', 120000, 'Av. Diagonal 88', 'Barcelona', 'Eixample', 3, 2, 95, 'apartment', 'bank', 5.8, 'Propiedad bancaria 22% bajo precio de mercado.')
ON CONFLICT DO NOTHING;
