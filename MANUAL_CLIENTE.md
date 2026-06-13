# MANUAL DE INSTRUCCIONES — GROUP 360 INICIATIVAS
**Sistema Web Inmobiliario v1.0.0**

---

## ÍNDICE

1. [Acceso al Panel de Administración](#1-acceso-al-panel-de-administración)
2. [Gestión de Propiedades](#2-gestión-de-propiedades)
3. [Gestión de Leads](#3-gestión-de-leads)
4. [Bot de WhatsApp (IA)](#4-bot-de-whatsapp-ia)
5. [Bot de Telegram (Notificaciones)](#5-bot-de-telegram-notificaciones)
6. [Portal de Inversores](#6-portal-de-inversores)
7. [Renovación del Token de WhatsApp](#7-renovación-del-token-de-whatsapp)
8. [Supabase — Base de Datos](#8-supabase--base-de-datos)
9. [Vercel — Despliegues](#9-vercel--despliegues)
10. [Configuración General](#10-configuración-general)
11. [Solución de Problemas](#11-solución-de-problemas)

---

## 1. Acceso al Panel de Administración

**URL:** `https://group365.vercel.app/admin`

Desde el panel admin puedes:
- Subir y gestionar **fotos de propiedades**
- Ver **leads** recibidos
- Ver **conversaciones de WhatsApp**
- Cambiar el token de WhatsApp manualmente

**Autenticación:** Utiliza el mismo login de Supabase Auth. Si no tienes usuario, créalo desde Supabase Dashboard → Authentication → Users → Invite user.

---

## 2. Gestión de Propiedades

### Crear una propiedad nueva

**Opción A — Desde Supabase (recomendado para empezar):**
1. Ir a [supabase.com](https://supabase.com) → Tu proyecto → **Table Editor → properties**
2. Clic en **Insert row**
3. Rellenar los campos:
   - `title`: Nombre de la propiedad (ej: "Piso 3 hab. Centro Madrid")
   - `price`: Precio en euros (solo número, sin puntos ni €)
   - `location`: Dirección
   - `city`: Ciudad
   - `bedrooms`, `bathrooms`: Número de habitaciones y baños
   - `area_sqm`: Metros cuadrados
   - `property_type`: `apartment` | `house` | `villa` | `commercial` | `land`
   - `channel`: `personal` | `bank` (banco) | `investor`
   - `is_active`: `true` para que aparezca en la web
   - `estimated_roi`: Rentabilidad estimada (número, ej: `5.2`)
4. Guardar

**Opción B — Desde el Panel Admin:**
1. Ir a `/admin`
2. Clic en "Nueva Propiedad"
3. Rellenar formulario y subir fotos

### Subir fotos de propiedades

1. En el Panel Admin → seleccionar la propiedad
2. Clic en "Subir Fotos"
3. Se suben al bucket `property-images` de Supabase Storage
4. Las URLs se guardan automáticamente en el campo `images` de la propiedad

### Desactivar una propiedad (vendida/alquilada)

En Supabase → Table Editor → properties → encontrar la propiedad → cambiar `is_active` a `false`.

---

## 3. Gestión de Leads

Los leads se guardan en la tabla `leads` de Supabase.

**Columnas importantes:**
- `name`, `email`, `phone`: Datos del cliente
- `type`: `buyer` | `investor` | `seller` | `renter` | `newsletter`
- `source`: De dónde vino el lead (`web` | `whatsapp` | `instagram`)
- `status`: `new` → `contacted` → `qualified` → `converted` | `discarded`
- `budget`: Presupuesto del cliente
- `message`: Mensaje que envió

**Actualizar estado de un lead:**
1. Supabase → Table Editor → leads
2. Encontrar el lead → cambiar `status`

---

## 4. Bot de WhatsApp (IA)

El bot responde automáticamente los mensajes del número `+34 611 25 18 18`.

### Cómo funciona

1. Cliente envía mensaje por WhatsApp
2. El bot responde usando GPT-4o-mini
3. Si el cliente parece un **vendedor**, llega alerta URGENTE por Telegram
4. Si es un **lead caliente** (habla de precio, reserva, inversión), llega notificación Telegram

### Las 4 áreas que conoce el bot

1. **Compraventa** — propiedades disponibles, trámites, precios
2. **Alquiler turístico** — gestión vacacional, rentabilidad
3. **Inversión bancaria** — deuda bancaria, proceso, ROI 4-6%
4. **Captación de vendedores** — cualquier persona que quiere vender su propiedad

### Activar/desactivar el bot

Para desactivar temporalmente: en Vercel → Settings → Environment Variables → eliminar o vaciar `OPENAI_API_KEY`. El bot usará respuesta de fallback ("Un especialista te contactará pronto").

---

## 5. Bot de Telegram (Notificaciones)

El bot de Telegram te avisa de todo lo importante en tiempo real.

### Comandos disponibles en Telegram

| Comando | Qué hace |
|---------|----------|
| `/start` | Muestra todos los comandos disponibles |
| `/leads` | Últimos 10 leads recibidos |
| `/propiedades` | Propiedades activas publicadas |
| `/vendedores` | Leads captados como potenciales vendedores |
| `/stats` | Estadísticas del sistema |

### Tipos de notificaciones automáticas

- **Nuevo lead** en formulario web → mensaje inmediato
- **WhatsApp seller detectado** → alerta con 🏠 URGENTE
- **WhatsApp lead caliente** → alerta con 🔥
- **Token WhatsApp expirado** → aviso con instrucciones

---

## 6. Portal de Inversores

**URL:** `https://group365.vercel.app/inversores`

### Registro de nuevo inversor
1. El inversor va a `/inversores/register`
2. Introduce email y contraseña
3. Recibe email de confirmación de Supabase
4. Puede iniciar sesión en `/inversores/login`
5. Accede a su dashboard personalizado en `/inversores/dashboard`

### Lo que ve el inversor en su dashboard
- Propiedades disponibles con canal `investor` o `bank`
- Su perfil y presupuesto configurado
- Botón de WhatsApp con mensaje pre-rellenado
- Botón para solicitar reunión

### Verificar un inversor manualmente
En Supabase → Table Editor → investor_profiles → cambiar `verified` a `true`.

---

## 7. Renovación del Token de WhatsApp

El token de WhatsApp dura 60 días. El sistema lo renueva automáticamente el día 1 de cada mes. Si necesitas renovarlo manualmente:

**Opción A — Automática (recomendada):**
1. Abrir en el navegador: `https://group365.vercel.app/api/admin/refresh-wa-token`
2. Verás un JSON con `success: true` si funcionó
3. Te llegará confirmación por Telegram

**Opción B — Manual (si el token ya expiró):**
1. Ir a [developers.facebook.com](https://developers.facebook.com) → Tu app → WhatsApp → API Setup
2. Generar nuevo token temporal
3. Ir a Vercel → Settings → Environment Variables → actualizar `WHATSAPP_TOKEN`
4. Hacer **Redeploy** en Vercel (importante: el cambio no aplica sin redeploy)
5. Luego llamar a `/api/admin/refresh-wa-token` para convertirlo en 60 días

---

## 8. Supabase — Base de Datos

**URL:** `https://supabase.com` → Iniciar sesión → Tu proyecto

### Tablas principales

| Tabla | Para qué |
|-------|----------|
| `properties` | Propiedades inmobiliarias |
| `leads` | Clientes y contactos |
| `investor_profiles` | Perfil de inversores registrados |
| `wa_conversations` | Historial WhatsApp |
| `agent_availability` | Disponibilidad para visitas |
| `app_settings` | Token WhatsApp y configuración |

### Hacer backup de los datos
Supabase → Settings → Database → Backups (disponible en plan Pro).

Para exportar datos manualmente:
1. Supabase → SQL Editor
2. Ejecutar: `SELECT * FROM leads ORDER BY created_at DESC;`
3. Descargar como CSV con el botón de descarga

---

## 9. Vercel — Despliegues

**URL:** `https://vercel.com` → Iniciar sesión → proyecto `group365`

### Hacer un cambio en la web

1. Editar el código en el ordenador
2. Abrir terminal en la carpeta del proyecto
3. Ejecutar:
   ```bash
   git add .
   git commit -m "descripción del cambio"
   git push origin main
   ```
4. Vercel detecta el push y despliega automáticamente (2-3 minutos)

### Ver logs en tiempo real

Vercel → Tu proyecto → Deployments → Ver el deployment → Logs

Útil para diagnosticar errores del WhatsApp bot.

### Variables de entorno

Vercel → Settings → Environment Variables

**IMPORTANTE:** Después de cambiar cualquier variable de entorno, debes hacer **Redeploy**:
Vercel → Deployments → clic en los 3 puntos del último deployment → **Redeploy**

---

## 10. Configuración General

Para cambiar cualquier texto, número o dato de la web, edita el archivo:

```
lib/config.ts
```

No necesitas tocar ningún otro archivo. Los cambios se aplican en toda la web automáticamente al hacer push.

### Qué puedes cambiar en config.ts

- Nombre de la empresa y slogan
- Email, WhatsApp, dirección
- Redes sociales (Instagram, TikTok...)
- Estadísticas del hero (propiedades vendidas, años de experiencia...)
- Textos principales de la landing
- Servicios que ofreces
- Testimonios de clientes
- Zonas de operación
- Datos del proceso de inversión (reserva, honorarios, ROI)
- Título y descripción para Google (SEO)

---

## 11. Solución de Problemas

### El bot de WhatsApp no responde

1. Verificar que el token no ha expirado → llamar a `/api/admin/refresh-wa-token`
2. Verificar que `WHATSAPP_PHONE_ID` en Vercel es el `phone_number_id` correcto (no el WABA ID)
3. Ir a Vercel → Logs → buscar errores con "WA"
4. Hacer Redeploy en Vercel

### No llegan notificaciones de Telegram

1. Verificar que `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` están en Vercel
2. Probar: `https://group365.vercel.app/api/test-notify`
3. Verificar que no bloqueaste el bot en Telegram (escribe `/start` al bot)

### La web no carga o sale error

1. Vercel → Deployments → ver si el último build falló
2. Clic en el deployment fallido → ver los logs de error
3. Si es un error de código, corregirlo y hacer push

### Un inversor no puede iniciar sesión

1. Supabase → Authentication → Users → buscar el email
2. Verificar que confirmó el email (check en columna "Email confirmed")
3. Si no confirmó: en Supabase → Users → clic en usuario → "Send email confirmation"

### Las fotos de propiedades no aparecen

1. Verificar que el bucket `property-images` existe en Supabase Storage
2. Verificar que el bucket es **público** (Settings → Public bucket)
3. Verificar que la URL de la imagen en la columna `images` es accesible

---

## Contacto y Soporte Técnico

**Desarrollado por:** macdestudios.com

Para soporte técnico, modificaciones o nuevas funcionalidades:
- Web: [macdestudios.com](https://macdestudios.com)

---

*GROUP 360 INICIATIVAS · GRUPO 360 INICIATIVAS S.L. · NIF B13911979*
*Versión 1.0.0 — Junio 2026*
