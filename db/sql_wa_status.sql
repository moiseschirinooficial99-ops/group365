-- ═══════════════════════════════════════════════════════════════
-- Acuses de entrega de WhatsApp (sent / delivered / read / failed)
-- Meta los empuja por webhook; los guardamos en la fila saliente
-- que coincida por wa_message_id.
-- Correr una vez en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════
alter table wa_conversations add column if not exists status text;
alter table wa_conversations add column if not exists status_at timestamptz;

-- El webhook busca por wa_message_id para actualizar el estado: índice para que sea rápido.
create index if not exists idx_wa_conversations_wa_message_id
  on wa_conversations (wa_message_id);
