# Plantilla Web Inmobiliaria — GROUP 360

Esta plantilla incluye todo lo necesario para lanzar una agencia inmobiliaria premium en menos de 48 horas.

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Supabase (DB + Auth + Storage)
- **IA**: OpenAI GPT-4o-mini (WhatsApp bot)
- **Mensajería**: WhatsApp Cloud API + Telegram Bot
- **Deploy**: Vercel

---

## Personalización en 1 archivo

Edita **`lib/config.ts`** y cambia:

| Campo | Qué cambia |
|-------|-----------|
| `empresa.nombre` | Logo, footer, copyright |
| `contacto.whatsapp` | Todos los links de WhatsApp |
| `contacto.email` | Footer |
| `redes.instagram` | Footer redes sociales |
| `stats.*` | Contadores animados del hero |
| `hero.*` | Textos del banner principal |
| `zonas` | Lista de zonas de operación |
| `inversion.*` | Proceso de inversión (reserva, honorarios, ROI) |

---

## Inicio rápido

```bash
# 1. Clonar repositorio
git clone <repo-url> mi-agencia
cd mi-agencia

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Ejecutar el SQL de Supabase
# Ir a Supabase → SQL Editor → pegar contenido de schema.sql

# 5. Desarrollo local
npm run dev

# 6. Desplegar en Vercel
vercel --prod
```

---

## Archivos clave

```
lib/config.ts              ← PERSONALIZACIÓN CENTRAL
.env.local                 ← Credenciales (nunca commitear)
app/api/whatsapp/route.ts  ← Bot WhatsApp + IA
app/api/telegram/route.ts  ← Bot Telegram para el dueño
app/api/leads/route.ts     ← Captura de leads
n8n-workflows/             ← Automatizaciones n8n
plantillas-inmobiliarias/  ← Esta carpeta
```

---

## Workflows n8n incluidos

1. `lead-notification.json` — Notificar Telegram al recibir lead
2. `whatsapp-qualification.json` — Calificar leads por WhatsApp
3. `telegram-property-publisher.json` — Publicar propiedades en canal
4. `telegram-calendar-sync.json` — Sincronizar visitas con Google Calendar
5. `whatsapp-ai-bot.json` — Bot IA alternativo en n8n
6. `new-lead-notification.json` — Email/SMS al nuevo lead

---

## Soporte

Desarrollado por [macdestudios.com](https://macdestudios.com)
