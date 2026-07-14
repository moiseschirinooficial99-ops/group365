# Módulo de Contratos — GROUP 360

Sistema de generación y envío de contratos desde el panel `/admin/contratos`.

## Arquitectura

```
Panel /admin/contratos
   │
   ├── "Generar PDF"  ──► POST /api/admin/generate-contract ──► descarga PDF
   │
   └── "Enviar email" ──► POST /api/admin/contracts/send
                               │  (crea/actualiza fila en Supabase `contratos`)
                               ▼
                          Webhook n8n (n8n.macdestudios.com)
                               │
                               ├─ 1. HTTP Request ► /api/admin/generate-contract  (obtiene PDF binario)
                               ├─ 2. Enviar Email (SMTP Hostalia) con PDF adjunto
                               ├─ 3. PATCH Supabase → estado = "enviado"
                               ├─ 4. Notificar Telegram
                               └─ 5. Responde { success: true, contrato_id }
```

## 1. Base de datos (Supabase)

Ejecuta en **Supabase → SQL Editor** (proyecto `ersxtjcuctujcrgahsir`):

```
plantillas-inmobiliarias/migration-contratos.sql
```

Crea la tabla `contratos (id, tipo, datos_json, estado, fecha, destinatario, ...)`.

## 2. Variables de entorno en Vercel

Añade en **Vercel → Settings → Environment Variables**:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `ADMIN_SECRET` | (ya existe) token del panel admin | — |
| `CONTRACTS_API_KEY` | clave que usa n8n para llamar a `/api/admin/generate-contract`. Si no la defines, se usa `ADMIN_SECRET`. | `una-clave-larga-aleatoria` |
| `N8N_CONTRACT_WEBHOOK_URL` | URL del webhook de producción de n8n | `https://n8n.macdestudios.com/webhook/contrato-360` |
| `SUPABASE_SERVICE_ROLE_KEY` | (ya existe) usada por la API | — |

## 3. Importar el workflow en n8n

1. En n8n (`n8n.macdestudios.com`) → **Workflows → Import from File** → `n8n/workflow-contratos.json`.
2. Copia la **Production URL** del nodo *Webhook: Contrato* y ponla en Vercel como `N8N_CONTRACT_WEBHOOK_URL`.
3. Crea las **variables de entorno de n8n** (Settings → Variables o `.env` del contenedor):
   - `CONTRACTS_API_KEY` (igual que en Vercel)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role del proyecto `ersxtjcuctujcrgahsir`)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. Crea la **credencial SMTP** (`SMTP Hostalia group360`) y asígnala al nodo *Enviar Email*:
   - Host: `mail.hostalia.com`
   - Puerto: `587`
   - Usuario: `info@group360iniciativas.com`
   - Contraseña: (la del buzón)
   - SSL/TLS: **STARTTLS** activado (puerto 587)
5. Activa el workflow.

## ⚠️ Nota sobre el envío del email (SMTP vs HTTP Request)

El pedido original indicaba "usar HTTP Request para el email, no el nodo nativo".
**SMTP no es HTTP**: n8n no puede hablar el protocolo SMTP con un nodo *HTTP Request*.
Para enviar por `mail.hostalia.com:587` la única vía correcta en n8n es el nodo
**Send Email (SMTP)**, que es el que usa este workflow.

Ese nodo envía SMTP directo contra Hostalia y **no añade ninguna marca de agua**
(la marca de agua no existe en el nodo SMTP de n8n; solo aplicaría a servicios de
envío de terceros). El resto de pasos (PDF, Supabase, Telegram, respuesta) sí usan
*HTTP Request* como se pidió.

> Si prefieres estrictamente enviar el email vía HTTP Request, la alternativa sería
> exponer un endpoint propio (p. ej. `/api/admin/send-contract-email` con nodemailer)
> y llamarlo con HTTP Request. Dímelo y lo añado.

## 4. Payload del webhook

```json
{
  "tipo_contrato": "loi",
  "datos_contrato": { "nombre_destinatario": "Carlos", "importe": "650000", "...": "..." },
  "email_destinatario": "cliente@email.com",
  "nombre_destinatario": "Carlos Martínez",
  "contrato_id": "uuid-del-contrato"
}
```

Respuesta:

```json
{ "success": true, "contrato_id": "uuid-del-contrato" }
```
