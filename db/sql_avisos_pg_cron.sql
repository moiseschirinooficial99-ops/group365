-- ═══════════════════════════════════════════════════════
-- AVISOS AUTOMÁTICOS (recordatorios de citas, seguimientos, resumen 8:00)
--
-- Sustituye al workflow de n8n: Supabase llama cada 10 min a
-- /api/admin/avisos con un token que genera aquí mismo la base de datos
-- (app_settings.avisos_token). La web lo valida contra esa misma fila, así
-- que nadie tiene que ver ni copiar ninguna clave.
--
-- Solo usa $$…$$ (sin comillas simples) para que copiar/pegar o el traductor
-- del navegador no rompan el SQL. Se puede ejecutar más de una vez.
-- EJECUTAR en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

INSERT INTO public.app_settings (key, value)
VALUES ($$avisos_token$$, replace(gen_random_uuid()::text || gen_random_uuid()::text, $$-$$, $$$$))
ON CONFLICT (key) DO NOTHING;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = $$group360-avisos$$;

SELECT cron.schedule(
  $$group360-avisos$$,
  $$*/10 * * * *$$,
  $cmd$
    SELECT net.http_get(
      url := $u$https://www.group360iniciativas.com/api/admin/avisos$u$,
      headers := jsonb_build_object(
        $h$Authorization$h$,
        $b$Bearer $b$ || (SELECT value FROM public.app_settings WHERE key = $k$avisos_token$k$)
      ),
      timeout_milliseconds := 30000
    );
  $cmd$
);
