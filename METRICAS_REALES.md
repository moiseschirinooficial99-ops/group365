# MÉTRICAS REALES — GROUP 360 INICIATIVAS
**Reporte generado:** 17/06/2026  
**Verificado sobre:** repositorio git `group365` · rama `main`

---

## 1. TIEMPO DE CONSTRUCCIÓN

| Hito | Fecha |
|------|-------|
| Primer commit | 10/06/2026 |
| Commit más reciente | 17/06/2026 |
| **Días totales** | **7 días** |
| Total de commits | 40 commits |

> Primer commit: *"360GROUP MVP completo"* — 10/06/2026  
> Último commit: *"feat: nuevo dominio group360iniciativas.com"* — 17/06/2026

**En 7 días se construyó desde cero una plataforma inmobiliaria completa con bot de IA, panel de administración, portal de inversores y gestión de alquileres.**

---

## 2. VOLUMEN DE CÓDIGO

| Métrica | Valor |
|---------|-------|
| Total líneas de código (`.ts` + `.tsx`) | **~5.800 líneas** |
| Páginas web creadas | **12 páginas** |
| API endpoints (routes) | **16 endpoints** |
| Tablas en Supabase (BD) | **6 tablas** |
| Archivos de librería/utils | **5 módulos** |

### Páginas creadas (12)
| Ruta | Descripción |
|------|-------------|
| `/` | Landing principal |
| `/compras` | Catálogo de propiedades en venta |
| `/alquileres` | Propiedades de alquiler vacacional |
| `/propiedades/[id]` | Ficha detalle de propiedad + calendario |
| `/inversores` | Portal de inversores (landing) |
| `/inversores/login` | Acceso al área privada |
| `/inversores/register` | Registro de inversores |
| `/inversores/dashboard` | Dashboard con calculadora ROI |
| `/admin` | Panel de administración |
| `/admin/login` | Acceso admin |
| `/admin/nueva-propiedad` | Publicar propiedad manual |
| `/privacidad` | Política de privacidad |

### API Endpoints (16)
| Endpoint | Función |
|----------|---------|
| `POST /api/whatsapp` | Webhook bot IA WhatsApp |
| `POST /api/whatsapp/send` | Envío manual de mensajes |
| `POST /api/telegram` | Bot Telegram (9 comandos) |
| `GET/POST /api/properties` | CRUD propiedades |
| `GET/POST /api/leads` | CRUD leads / scoring |
| `GET /api/rental-availability` | Calendario disponibilidad |
| `POST /api/admin/login` | Autenticación admin |
| `GET /api/admin/calendar` | Disponibilidad agente |
| `POST /api/admin/refresh-wa-token` | Auto-renovación token WhatsApp |
| `POST /api/admin/upload-image` | Subida de imágenes |
| `GET/POST/DELETE /api/admin/rental-availability` | Gestión reservas alquiler |
| `POST /api/admin/notify-sold` | Notificación propiedad vendida |
| `POST /api/ai/generate-description` | IA genera descripción propiedad |
| `POST /api/ai/generate-video-prompt` | IA genera prompt para vídeo |
| `POST /api/ai/generate-videos` | Integración generación de vídeos |
| `GET /api/test-notify` | Test notificaciones Telegram |

### Tablas en Supabase (6)
| Tabla | Uso |
|-------|-----|
| `properties` | Propiedades inmobiliarias |
| `leads` | Clientes captados con scoring |
| `wa_conversations` | Historial conversaciones WhatsApp |
| `agent_availability` | Calendario del agente / visitas |
| `app_settings` | Configuración dinámica (token WA, etc.) |
| `rental_availability` | Reservas y bloqueos de alquiler |

---

## 3. INTEGRACIONES ACTIVAS

| API / Servicio | Estado | Función |
|----------------|--------|---------|
| **WhatsApp Business API** (Meta Graph v18.0) | ✅ Activa | Bot IA atiende clientes 24/7, envía respuestas automáticas |
| **OpenAI GPT-4o-mini** | ✅ Activa | Motor de IA del bot WhatsApp + generación de descripciones |
| **Telegram Bot API** | ✅ Activa | Panel de control para José Luis (leads, stats, visitas) |
| **Supabase** | ✅ Activa | Base de datos PostgreSQL + storage de imágenes |
| **n8n** (self-hosted en Hetzner VPS) | ✅ Activa | Automatizaciones y workflows internos |
| **Vercel** | ✅ Activa | Hosting, CI/CD automático en cada push |

---

## 4. COSTOS REALES MENSUALES ESTIMADOS

> **NOTA:** Los valores marcados con `*` son estimaciones basadas en los planes conocidos del proyecto. Los costos reales de OpenAI y n8n dependen del volumen de uso mensual real y deben verificarse en los dashboards respectivos.

| Servicio | Plan | Coste mensual |
|----------|------|---------------|
| **Vercel** | Hobby (gratuito) | **€0** |
| **Supabase** | Free tier (500MB BD / 2GB storage) | **€0** |
| **OpenAI GPT-4o-mini** * | Pago por uso · $0.15/1M input + $0.60/1M output | **~$3–15/mes** según volumen |
| **Hetzner VPS** (n8n) * | CX11 / CX21 (estimado) | **~€4–7/mes** |
| **Dominio** (.com) * | Renovación anual ~€15/año | **~€1.25/mes** |
| **WhatsApp Business API** | Tier gratuito (primeras 1.000 conversaciones/mes) | **€0 – €0.04/conv adicional** |
| **TOTAL ESTIMADO** | | **~€5–25/mes** |

> El stack completo corre por menos de €25/mes. Una inmobiliaria tradicional gasta más en papel y sellos.

---

## 5. AUTOMATIZACIONES

### Bot WhatsApp (IA)
- **Motor:** GPT-4o-mini con system prompt de ~300 líneas de contexto inmobiliario
- **Funciones:** Detecta tipo de cliente (inversor / comprador / propietario / curioso), cualifica leads, responde sobre NPL, alquiler y compraventa, escala a humano cuando detecta señales de cierre
- **Scoring automático:** 0–100% con 3 niveles (frío / interesado / caliente)
- **Tiempo de respuesta estimado:** 1–3 segundos (GPT-4o-mini + latencia Vercel Edge)
- **Historial:** Últimos 8 mensajes de contexto por conversación
- **Regla anti-error:** Pregunta qué propiedad antes de dar disponibilidad

### Bot Telegram — Panel de Control (9 comandos)
| Comando | Función |
|---------|---------|
| `/start` | Panel de bienvenida con menú completo |
| `/leads` | Últimos 10 leads con score y datos |
| `/vendedores` | Leads de captación detectados |
| `/stats` | Estadísticas en tiempo real |
| `/disponible [nota]` | Marcar disponibilidad en el calendario |
| `/ocupado [nota]` | Bloquear agenda |
| `/visita [dd/mm] [hh:mm] [nombre]` | Agendar visita |
| `/sold [id]` | Marcar propiedad como vendida |
| **Foto + caption** | Publica propiedad directamente desde el móvil |

### Notificaciones automáticas (Telegram alerts)
- Nuevo lead captado → alerta inmediata con datos
- Lead caliente (score >70%) → alerta urgente
- Vendedor detectado → alerta de captación
- Token WhatsApp expirado → aviso con instrucciones
- Nueva propiedad publicada → confirmación
- Nueva reserva de alquiler → datos completos
- Resumen diario de estadísticas

### n8n Workflows
- Instalado en Hetzner VPS (self-hosted)
- Commit: *"Add n8n workflows + fix supabase build-safe init"*
- Número exacto de workflows activos: **verificar en dashboard n8n**

---

## 6. CHECKLIST DE CAPTURAS PARA MARKETING

### Prioridad ALTA — mostrar el producto en acción

- [ ] **Landing principal** — `group360iniciativas.com/`  
  *Grabar el scroll completo mostrando el hero, propiedades y secciones de servicios*

- [ ] **Conversación real del bot WhatsApp**  
  *Enviar mensaje: "Quiero información sobre invertir en NPL" y capturar la respuesta del bot con datos reales*

- [ ] **Bot preguntando qué propiedad** (el fix recién implementado)  
  *Enviar: "Quiero consultar disponibilidad de alquiler" → bot responde listando opciones sin asumir ninguna*

- [ ] **Notificación Telegram en tiempo real**  
  *Capturar el momento en que llega un lead caliente al móvil de José Luis con el score y los datos*

- [ ] **Panel admin con propiedades** — `group360iniciativas.com/admin`  
  *Mostrar la lista de propiedades activas, con las fichas y el estado*

- [ ] **Dashboard inversores con calculadora ROI** — `group360iniciativas.com/inversores/dashboard`  
  *Capturar la calculadora funcionando con números reales*

- [ ] **Ficha de propiedad con calendario** — `group360iniciativas.com/propiedades/[id]`  
  *Mostrar el calendario de disponibilidad con fechas marcadas*

### Prioridad MEDIA — features diferenciadoras

- [ ] **Publicar propiedad desde Telegram**  
  *Grabar: enviar foto con caption al bot → propiedad aparece en la web en segundos*

- [ ] **Comando `/stats` en Telegram**  
  *Capturar la respuesta con leads del mes, propiedades activas y tasa de conversión*

- [ ] **Portal inversores** — `group360iniciativas.com/inversores`  
  *Landing de inversores con la propuesta de valor NPL*

- [ ] **Página de alquileres** — `group360iniciativas.com/alquileres`  
  *Catálogo de propiedades de alquiler vacacional*

### Prioridad BAJA — credibilidad

- [ ] **Estadísticas del proyecto** (este documento)  
  *7 días de desarrollo, 40 commits, 5.800 líneas de código*

- [ ] **Redirect automático** — acceder a `group365.vercel.app` y que redirija a `group360iniciativas.com`  
  *Prueba de que el dominio antiguo redirige al nuevo*

---

## RESUMEN EJECUTIVO

```
⏱️  7 días de desarrollo (10/06 → 17/06/2026)
📝  40 commits · ~5.800 líneas de código
🗂️  12 páginas web + 16 API endpoints + 6 tablas BD
🤖  Bot WhatsApp con IA 24/7 + Panel Telegram con 9 comandos
🔗  6 integraciones activas (WhatsApp · OpenAI · Telegram · Supabase · n8n · Vercel)
💶  Coste operativo: ~€5–25/mes (stack 100% cloud)
🌐  Dominio: group360iniciativas.com
```
