
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

## 2026-11-02 — PDF → oportunidad/propiedad con IA
- Panel: en **Oportunidades** y **Nueva propiedad** se sube un PDF (o foto). Claude (opus-5-5) rellena los campos y las fotos JPEG que trae el PDF se extraen con pdf-lib y se suben solas a `property-images`.
- El PDF va directo a Supabase con URL firmada (bucket privado `property-docs`, se crea solo, máx. 20 MB): así se salta el límite de 4,5 MB de Vercel.
- Rutas nuevas: `/api/admin/documents/upload-url` y `/api/admin/documents/analyze`. Lógica en `lib/documentAnalyzer.ts`; cliente en `lib/uploadDocument.ts`.
- Fix: al publicar una oportunidad con "avisar a inversores", el envío de WhatsApp ahora se espera (antes era una promesa suelta que Vercel podía cortar).
- Probado: extracción de fotos con PDF de prueba (2/2 fotos buenas; descarta logo, CMYK y duplicada). `next build` OK. La lectura con IA solo se puede probar en producción/preview.
- WhatsApp: el 611 sigue Conectado; Meta envía al webhook pero respondemos 401 porque `META_APP_SECRET` en Vercel no coincide con la app 968681136164152. Pendiente que Moisés la actualice.

## 2026-11-02 — Bot conversacional + base para campañas (PR #10)
- Bot WhatsApp: saludo humano primero, mensajes de 1-3 frases, una pregunta por mensaje, captación paso a paso (nombre → qué busca → zona → presupuesto/plazo → llamada). Regla de seguridad: nunca códigos SMS ni portabilidades. max_tokens 500 → 350.
- Anuncios "clic a WhatsApp" de Meta: el `referral` del primer mensaje crea el lead con source `anuncio_meta_whatsapp` + titular/ID del anuncio, aviso por Telegram y la IA conecta con lo que ofrecía el anuncio.
- Web: `lib/attribution.ts` guarda UTM + clic de anuncio (fbclid/gclid) 30 días; todos los formularios (sendLead) y el registro de inversores mandan "Origen campaña" al CRM.
- Píxel de Meta: el código ya existe (Analytics + trackLead); falta NEXT_PUBLIC_META_PIXEL_ID.

## 2026-11-02 — Bot: conocimiento inmobiliario, estilos A/B/C y simulador
- `lib/botKnowledge.ts`: conocimiento del sector (compra, arras, gastos, ITP Cataluña por tramos, Golden Visa eliminada, licencias HUT y Decreto-ley 3/2023 con caducidad nov-2028, Registro Único de alquiler corto desde jul-2025, zonas Costa Dorada, técnica comercial y persuasión honesta). Revisar cada trimestre.
- Estilos en prueba: A consultivo, B directo, C historias. Cada teléfono tiene siempre el mismo (hash del número). Comparativa: `GET /api/admin/bot-estilos?dias=30` (conversaciones, enganchados, con nombre, citas, ganados).
- Prompt sacado a `lib/botPrompt.ts` (lo comparten webhook y simulador). Quitado "riesgo cero" y rentabilidades como promesa.
- Simulador: `npx tsx scripts/probar-bot.ts [A|B|C] [cliente]` → 6 clientes ficticios conversan con el bot; transcripción en `pruebas-bot/` (gitignored).
- Producción: PR #9 y #10 ya mergeados y desplegados (ruta de documentos responde 401 sin sesión = OK).

## 2026-11-02 — Ajustes del bot tras el simulador
- Primera prueba (6 clientes): buen saludo y cierre de llamadas, pero mensajes de 55–122 palabras, rechazó hablar inglés, dijo "garantizado" y "no pagas abogados", inventó un rango de precio y el estado de licencias de La Pineda, y usaba **negrita** Markdown.
- Arreglo: RECORDATORIO_FINAL al final del prompt (idioma del cliente, ≤50 palabras, formato WhatsApp, sin precios/valoraciones, sin estado de licencias por municipio, sin "garantizado/blindado", citas las confirma José Luis), limpieza de "garantizado/blindado" en el prompt base, `toWhatsAppFormat()` antes de enviar y max_tokens 350 → 250. El simulador marca ahora esas palabras.
- 2ª prueba: inglés OK, sin precios ni licencias inventados, sin ** , 41–56 palabras de media (inversor 91 y cortado a mitad de frase). Ajuste: max_tokens 320 + recorte automático a la última frase completa (`cerrarFrase`), sin plazos prometidos ("hoy mismo") ni cifras de negociación, estilo C con historias de 2-3 frases.

## 2026-11-03 — Arreglo subida de PDF/flyer en el panel (PR #13)
- Error al subir PDF en Oportunidades. La IA funciona (probada en local con clave de prod); el fallo estaba en la subida.
- `uploadToSignedUrl` con un File lo enviaba como formulario e ignoraba contentType → ahora bytes en crudo con tipo explícito.
- Tipo por extensión, aviso HEIC, errores legibles por paso (preparar/subir/analizar), maxDuration 300 s, fotos en paralelo.
- gh: la cuenta activa era klarospro; cambiada a moiseschirinooficial99-ops (`gh auth switch`).

## 2026-11-03 — Causa real del error de subida: clave Supabase con BOM (PR #14)
- Tras PR #13 el panel mostró: "Failed to execute 'set' on 'Headers': String contains non ISO-8859-1 code point".
- En Vercel Production `NEXT_PUBLIC_SUPABASE_ANON_KEY` empieza por `﻿` (BOM al pegarla). Rompe toda llamada a Supabase desde el navegador (subida PDF, login inversores).
- Fix: `next.config.js` limpia las variables de Supabase antes de incrustarlas; `lib/supabase.ts` también. Probado con build con BOM → bundle limpio.
- Pendiente Moisés: volver a pegar la clave limpia en Vercel (Settings → Environment Variables).
