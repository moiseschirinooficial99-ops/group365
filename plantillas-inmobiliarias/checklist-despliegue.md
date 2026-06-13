# Checklist de Despliegue — Plantilla Inmobiliaria

Sigue estos pasos en orden para tener tu agencia online en menos de 2 horas.

---

## FASE 1 — Personalización (20 min)

- [ ] Editar `lib/config.ts` con los datos reales de la empresa
- [ ] Reemplazar `/public/logo.png` con el logo de la agencia (fondo transparente, PNG)
- [ ] Revisar `app/layout.tsx` — título, descripción y favicon del SEO
- [ ] Ajustar colores en `lib/config.ts` (primario y secundario)

---

## FASE 2 — Supabase (20 min)

- [ ] Crear proyecto en [supabase.com](https://supabase.com)
- [ ] Ir a **SQL Editor** y ejecutar el contenido de `plantillas-inmobiliarias/schema.sql`
- [ ] Ir a **Settings → API** y copiar:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Crear bucket en **Storage** llamado `property-images` (acceso público)
- [ ] Activar **Auth → Email** para registro de inversores

---

## FASE 3 — WhatsApp Business (30 min)

- [ ] Ir a [developers.facebook.com](https://developers.facebook.com) y crear app tipo **Business**
- [ ] Agregar producto **WhatsApp** a la app
- [ ] En **WhatsApp → Getting Started**: copiar `Phone Number ID` → `WHATSAPP_PHONE_ID`
- [ ] Generar token temporal → `WHATSAPP_TOKEN` (luego se auto-renueva)
- [ ] Copiar `App ID` → `META_APP_ID` y `App Secret` → `META_APP_SECRET`
- [ ] Configurar webhook con URL: `https://tu-dominio.vercel.app/api/whatsapp`
  - Verify Token: el mismo valor que en `WHATSAPP_VERIFY_TOKEN`
  - Suscribir a: `messages`

---

## FASE 4 — Telegram Bot (10 min)

- [ ] Hablar con [@BotFather](https://t.me/BotFather) en Telegram → `/newbot`
- [ ] Copiar el token → `TELEGRAM_BOT_TOKEN`
- [ ] Hablar con [@userinfobot](https://t.me/userinfobot) para obtener tu `Chat ID` → `TELEGRAM_CHAT_ID`
- [ ] Configurar webhook del bot:
  ```
  https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tu-dominio.vercel.app/api/telegram
  ```

---

## FASE 5 — OpenAI (5 min)

- [ ] Ir a [platform.openai.com](https://platform.openai.com) → API Keys → Create new
- [ ] Copiar key → `OPENAI_API_KEY`
- [ ] Asegurarse de tener créditos en la cuenta (mínimo $5 para empezar)

---

## FASE 6 — Variables en Vercel (10 min)

Ir a **Vercel → Settings → Environment Variables** y agregar:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WHATSAPP_TOKEN
WHATSAPP_PHONE_ID
WHATSAPP_VERIFY_TOKEN        = mi_agencia_verify_2024
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
OPENAI_API_KEY
NEXT_PUBLIC_BASE_URL         = https://mi-dominio.vercel.app
NEXT_PUBLIC_AGENT_WHATSAPP   = 34XXXXXXXXX
META_APP_ID
META_APP_SECRET
```

---

## FASE 7 — Despliegue (5 min)

```bash
# Opción A: desde CLI
vercel --prod

# Opción B: push a main (si tienes CI/CD con GitHub)
git push origin main
```

- [ ] Verificar build exitoso en Vercel
- [ ] Probar WhatsApp enviando un mensaje al número configurado
- [ ] Verificar notificaciones Telegram (`GET /api/test-notify`)
- [ ] Subir 2-3 propiedades de ejemplo desde Supabase Table Editor

---

## FASE 8 — Token permanente WhatsApp (5 min)

Después de tener todo funcionando, llama a:

```
GET https://tu-dominio.vercel.app/api/admin/refresh-wa-token
```

Esto intercambia el token temporal por uno de 60 días y lo guarda automáticamente en Supabase. El cron job lo renueva cada 1ro de mes.

---

## Verificación final

- [ ] Landing page carga correctamente
- [ ] Formulario de contacto crea lead en Supabase
- [ ] Bot WhatsApp responde mensajes
- [ ] Telegram recibe notificaciones de leads
- [ ] Portal inversores funciona (registro + login)
- [ ] Admin panel permite subir fotos
