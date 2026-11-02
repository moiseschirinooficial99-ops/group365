
## 2026-11-01 — WhatsApp sin funcionar
- Último mensaje guardado: 21-oct 09:20. Desde entonces no entra ningún mensaje al webhook (el webhook guarda el entrante ANTES de responder, así que no es el token: Meta ha dejado de enviarlos).
- Justo antes: alguien "de Helpfono" escribió al bot diciendo que tramitaba la portabilidad del número y pidiendo un código SMS. Hipótesis: el número salió de la API de WhatsApp Cloud (portabilidad o registro en otra app con ese SMS).
- El token de `.env.local` está caducado (12-ago); producción usa otro en Vercel. `app_settings.whatsapp_token` está vacío.
- Pendiente: mirar el estado del número en WhatsApp Manager y preguntar al cliente si pidió la portabilidad.
- Vercel CLI instalada, sesión eliuchirino-3369 y carpeta enlazada a 360group. Producción OK (último despliegue Ready, hace 24 días). Las variables WHATSAPP_* existen en Vercel.

## 2026-11-02 — Revisión completa + informe para el cliente
- Informe para el cliente: `INFORME_REVISION_2026-11.md` (fallos, agentes actuales y plan en 3 fases).
- Urgentes: WhatsApp caído; faltan en Vercel NEXT_PUBLIC_META_PIXEL_ID / GA (campaña sin medición); falta N8N_CONTRACT_WEBHOOK_URL (el envío de contratos falla).
- Seguridad pendiente: POST /api/leads mete el body sin filtrar; GET /api/investment-opportunities devuelve las privadas sin login; refresh-wa-token sin auth; webhooks WA/Telegram sin verificar firma; login sin límite de intentos y cookie = ADMIN_SECRET.
- Scoring premia Madrid/Marbella en vez de Costa Dorada; sitemap sin fichas /propiedades/[id]; el bot ignora audios e imágenes.
- Cambio de número de WhatsApp en marcha: abiertos WhatsApp Manager (WABA 1747480553348187) y la app de Meta (968681136164152).
- Revisión web pública (añadida al informe, 3.7–3.11): el form de la home marca "enviado" aunque falle (no mira res.ok); /propiedades/[id] es client component y descarga /api/properties entero (887 KB, 218 props) para mostrar una → sin SEO por ficha ni og:image propia; claims "garantizado"; testimonios de Madrid; faltan /aviso-legal, /cookies y banner de consentimiento; 207/218 props son de eXp y 0 vendidas (casos de éxito vacíos). El número de WhatsApp está centralizado en lib/config.ts (contacto.whatsapp).
