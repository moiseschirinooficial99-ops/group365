// ═══════════════════════════════════════════════════════════════
// Crea la plantilla de WhatsApp "nueva_oportunidad" en Meta.
// Una plantilla aprobada permite avisar a inversores AUNQUE lleven
// días sin escribir (fuera de la ventana de 24h de Meta).
//
// Uso:  node scripts/create-wa-template.mjs
// Requiere en .env.local: WHATSAPP_TOKEN y WHATSAPP_PHONE_ID
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

function loadEnv(file) {
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const l = line.trim()
    if (!l || l.startsWith('#') || !l.includes('=')) continue
    const i = l.indexOf('=')
    out[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const env = loadEnv(envPath)
const TOKEN = env.WHATSAPP_TOKEN
const PHONE_ID = env.WHATSAPP_PHONE_ID
const GRAPH = 'https://graph.facebook.com/v19.0'

if (!TOKEN || !PHONE_ID) {
  console.error('❌ Falta WHATSAPP_TOKEN o WHATSAPP_PHONE_ID en .env.local')
  process.exit(1)
}

const template = {
  name: 'nueva_oportunidad',
  language: 'es',
  category: 'MARKETING',
  components: [
    {
      type: 'BODY',
      text:
        '🔔 Nueva oportunidad de inversión disponible: {{1}}\n\n' +
        'Categoría: {{2}}\n\n' +
        'Entra en tu panel privado para ver fotos, características y documentación, ' +
        'o responde a este mensaje y te informamos.',
      example: { body_text: [['Vivienda unifamiliar en Málaga', 'NPL — Hipoteca Impagada']] },
    },
    {
      type: 'BUTTONS',
      buttons: [
        { type: 'URL', text: 'Ver en el portal', url: 'https://www.group360iniciativas.com/inversores' },
      ],
    },
  ],
}

const main = async () => {
  console.log('→ Obteniendo la cuenta de WhatsApp Business (WABA)...')
  const r1 = await fetch(`${GRAPH}/${PHONE_ID}?fields=whatsapp_business_account&access_token=${TOKEN}`)
  const j1 = await r1.json()
  if (!r1.ok || !j1?.whatsapp_business_account?.id) {
    console.error('❌ No se pudo obtener el WABA id:', JSON.stringify(j1, null, 2))
    process.exit(1)
  }
  const waba = j1.whatsapp_business_account.id
  console.log('   WABA id:', waba)

  console.log('→ Creando la plantilla "nueva_oportunidad"...')
  const r2 = await fetch(`${GRAPH}/${waba}/message_templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...template, access_token: TOKEN }),
  })
  const j2 = await r2.json()
  if (!r2.ok) {
    console.error('❌ Meta rechazó la plantilla:', JSON.stringify(j2, null, 2))
    process.exit(1)
  }
  console.log('✅ Plantilla enviada a revisión:', JSON.stringify(j2, null, 2))
  console.log('\nMeta suele aprobarla en minutos. Míralo en WhatsApp Manager → Plantillas de mensajes.')
  console.log('Cuando esté "Aprobada", los avisos de oportunidades se entregarán a todos los inversores.')
}

main().catch(e => { console.error(e); process.exit(1) })
