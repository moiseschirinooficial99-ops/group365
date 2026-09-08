-- ═══════════════════════════════════════════════════════
-- FIX: columna `type` que falta en `leads`
--
-- El código (formulario de contacto de la home, newsletter del footer,
-- lib/notifications.ts) lleva tiempo mandando un campo `type` al insertar
-- en `leads`, pero la columna nunca se creó en la tabla. Resultado: cada
-- envío de esos formularios fallaba con error 500 y el lead se perdía sin
-- dejar rastro (comprobado en directo: PGRST204 "Could not find the
-- 'type' column of 'leads' in the schema cache").
--
-- De paso, `type` es la columna que separa los dos embudos que pidió
-- Moises: 'vendedor' y 'comprador' (además de 'inversor', 'contacto',
-- 'newsletter', 'alquiler' que ya usa el código existente).
--
-- EJECUTAR en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════

ALTER TABLE leads ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'contacto';

CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
