process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load .env.local manually (no dotenv dependency needed)
const envFile = join(ROOT, '.env.local')
try {
  const lines = readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch { /* .env.local missing — rely on existing env */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const IMAGE_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

async function uploadFolder(folderPath, prefix) {
  // Check what's already uploaded for this prefix
  const { data: existing } = await supabase.storage
    .from('property-images')
    .list(prefix)

  if (existing && existing.length > 0) {
    console.log(`  Encontradas ${existing.length} imágenes ya subidas, reutilizando.`)
    return existing.map(f => {
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(`${prefix}/${f.name}`)
      return publicUrl
    })
  }

  const files = readdirSync(folderPath)
  const urls = []

  for (const filename of files) {
    const ext = extname(filename).toLowerCase()
    if (!IMAGE_MIME[ext]) continue

    const filePath = join(folderPath, filename)
    const buffer = readFileSync(filePath)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${prefix}/${safeName}`

    console.log(`  Subiendo: ${filename}`)
    const { error } = await supabase.storage
      .from('property-images')
      .upload(storagePath, buffer, { contentType: IMAGE_MIME[ext], upsert: true })

    if (error) {
      console.warn(`  WARN upload ${filename}: ${error.message}`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(storagePath)

    urls.push(publicUrl)
  }

  return urls
}

async function main() {
  // ── PROPIEDAD 1: Villa Cañelles ──────────────────────────────────────────
  console.log('\n[1/2] Imágenes — Villa Cañelles...')
  const villa1Folder = join(ROOT, 'propiedad', 'villa cañelles')
  const villa1Images = await uploadFolder(villa1Folder, 'villa-canyelles')
  console.log(`  ${villa1Images.length} imagen(es) listas.`)

  // Poner portada primero
  const portadaIdx1 = villa1Images.findIndex(u => u.toLowerCase().includes('portada'))
  if (portadaIdx1 > 0) {
    const [p] = villa1Images.splice(portadaIdx1, 1)
    villa1Images.unshift(p)
  }

  console.log('[1/2] Insertando en Supabase...')
  const { data: prop1, error: err1 } = await supabase
    .from('properties')
    .insert({
      title: 'Villa Contemporánea con Piscina — Canyelles',
      description: `Exclusiva villa de arquitectura contemporánea situada en Canyelles. Una propiedad diseñada para disfrutar del confort, la privacidad y la luminosidad, combinando espacios amplios, acabados de calidad y espectaculares vistas panorámicas. Una oportunidad única para vivir o invertir en una de las zonas más atractivas de la Costa de Barcelona.

CARACTERÍSTICAS:
- 3 dormitorios: dos amplios dormitorios dobles y un dormitorio individual
- Exclusiva suite principal con jacuzzi y ducha efecto cascada
- 2 baños completos de diseño contemporáneo
- Piscina privada con elegante zona solárium
- Amplias terrazas con vistas panorámicas despejadas
- Zona exterior con barbacoa integrada
- Impresionante salón de doble altura con abundante luz natural
- Sistema de calefacción y aire acondicionado en toda la vivienda`,
      price: 680000,
      location: 'Canyelles, Barcelona',
      zone: 'Canyelles',
      channel: 'personal',
      property_type: 'villa',
      bedrooms: 3,
      bathrooms: 2,
      area_sqm: 350,
      is_active: true,
      is_featured: false,
      main_image: villa1Images[0] || null,
      images: villa1Images,
    })
    .select()
    .single()

  if (err1) console.error('ERROR Villa Cañelles:', err1.message)
  else console.log(`  OK — ID: ${prop1.id}`)

  // ── PROPIEDAD 2: El Catllar ───────────────────────────────────────────────
  console.log('\n[2/2] Imágenes — El Catllar...')
  const catllarFolder = join(ROOT, 'propiedad', 'Catllar(Tarragona')
  const catllarImages = await uploadFolder(catllarFolder, 'el-catllar')
  console.log(`  ${catllarImages.length} imagen(es) listas.`)

  // Poner portada primero
  const portadaIdx2 = catllarImages.findIndex(u => u.toLowerCase().includes('portada') || u.toLowerCase().includes('principal'))
  if (portadaIdx2 > 0) {
    const [p] = catllarImages.splice(portadaIdx2, 1)
    catllarImages.unshift(p)
  }

  console.log('[2/2] Insertando en Supabase...')
  const { data: prop2, error: err2 } = await supabase
    .from('properties')
    .insert({
      title: 'Vivienda Unifamiliar con Parcela 850m² — El Catllar',
      description: `Magnífica vivienda unifamiliar independiente y esquinera, ubicada en una amplia parcela de 850 m², que combina comodidad, amplitud y un entorno natural privilegiado.

La vivienda principal cuenta con 200 m² construidos, distribuidos en dos plantas.

PLANTA BAJA:
- Amplio y luminoso salón-comedor con acceso a terraza cubierta acristalada
- Cocina independiente con salida a terraza cubierta (~25 m²) conectada a piscina
- Baño completo
- Habitación doble
- Garaje de ~30 m² (habilitado como despensa y lavadero)

PLANTA SUPERIOR:
- 3 dormitorios dobles, uno tipo suite con vestidor
- 2 baños completos
- Terraza amplia con acceso desde suite y otro dormitorio

EXTERIOR:
- Parcela de 850 m²
- Piscina privada
- Zonas de jardín y ocio al aire libre`,
      price: 0,
      location: 'El Catllar, Tarragona',
      zone: 'El Catllar',
      channel: 'personal',
      property_type: 'house',
      bedrooms: 4,
      bathrooms: 3,
      area_sqm: 200,
      is_active: true,
      is_featured: false,
      main_image: catllarImages[0] || null,
      images: catllarImages,
    })
    .select()
    .single()

  if (err2) console.error('ERROR El Catllar:', err2.message)
  else console.log(`  OK — ID: ${prop2.id}`)

  console.log('\nDone.')
}

main().catch(console.error)
