-- ═══════════════════════════════════════════════════════════════
-- Tabla de configuración de la app — guarda el token de WhatsApp
-- renovado automáticamente por /api/admin/refresh-wa-token.
--
-- Sin esta tabla, la renovación automática falla en silencio y el
-- bot se queda sin token válido cada ~60 días (esto es lo que pasó:
-- el token caducó el 12-ago-2026 y nunca se renovó porque la tabla
-- no existía).
--
-- Correr una vez en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════
create table if not exists app_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz default now(),
  expires_at  timestamptz
);

alter table app_settings enable row level security;
-- Sin policy: solo se accede con SUPABASE_SERVICE_ROLE_KEY (backend), no desde el navegador.
