// ═══════════════════════════════════════════════════════
// IMPORTADOR DE PROPIEDADES — INMOVILLA (eXp España, agencia 8930)
//
// Lee el XML de Inmovilla y lo vuelca en la tabla `properties` de
// Supabase. Hace upsert por `external_ref`, así que se puede ejecutar
// tantas veces como quieras: actualiza en vez de duplicar.
//
// ANTES DE USARLO: ejecuta db/sql_import_inmovilla.sql en Supabase.
//
//   node scripts/import-inmovilla.mjs                  → simulacro (no escribe)
//   node scripts/import-inmovilla.mjs --write          → importa Tarragona
//   node scripts/import-inmovilla.mjs --write --provincia=all
//   node scripts/import-inmovilla.mjs --write --provincia=BARCELONA --limit=50
//
// Flags:
//   --write            escribe de verdad (sin esto solo simula)
//   --provincia=X      filtra por provincia. 'all' = todas. Por defecto TARRAGONA
//   --ciudad=X         filtra además por ciudad (ej: --ciudad=Reus)
//   --limit=N          importa como mucho N propiedades
//   --url=...          URL del XML (por defecto INMOVILLA_XML_URL del .env.local)
// ═══════════════════════════════════════════════════════

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local manually (no dotenv dependency needed)
try {
  const lines = readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim()
  }
} catch { /* .env.local missing — rely on existing env */ }

// ── Argumentos ───────────────────────────────────────────
const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const hit = args.find(a => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}
const WRITE     = args.includes('--write')
const PROVINCIA = (flag('provincia', 'TARRAGONA') || '').toUpperCase()
const CIUDAD    = (flag('ciudad', '') || '').toLowerCase()
const LIMIT     = Number(flag('limit', '0')) || 0
const XML_URL   = flag('url', process.env.INMOVILLA_XML_URL)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!XML_URL) {
  console.error('Falta la URL del XML. Añade INMOVILLA_XML_URL a .env.local o pasa --url=...')
  process.exit(1)
}
if (WRITE && (!SUPABASE_URL || !SERVICE_ROLE_KEY)) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

// ── Parseo del XML ───────────────────────────────────────
// El feed es plano: <propiedad> con ~240 hijos sin anidar, así que no
// hace falta traer una librería de XML sólo para esto.
const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .trim()

function fields(block) {
  const out = {}
  // Ojo: las etiquetas pueden llevar atributos — las fotos vienen como
  // <foto24 eti="alrededores">…</foto24>. Sin el (?:\s[^>]*)? se pierden.
  const re = /<([a-zA-Z0-9_]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g
  let m
  while ((m = re.exec(block)) !== null) out[m[1]] = decode(m[2])
  return out
}

function splitProperties(xml) {
  const blocks = []
  let from = 0
  for (;;) {
    const start = xml.indexOf('<propiedad>', from)
    if (start === -1) break
    const end = xml.indexOf('</propiedad>', start)
    if (end === -1) break
    blocks.push(xml.slice(start + 11, end))
    from = end + 12
  }
  return blocks
}

// ── Mapeo de campos ──────────────────────────────────────
const TIPOS = {
  'piso': 'apartment', 'apartamento': 'apartment', 'ático': 'apartment',
  'atico': 'apartment', 'dúplex': 'apartment', 'duplex': 'apartment',
  'estudio': 'apartment', 'planta baja': 'apartment',
  'casa': 'house', 'adosado': 'house', 'pareado': 'house',
  'casa tipo dúplex': 'house', 'caserón': 'house', 'cortijo': 'house',
  'chalet': 'villa', 'villa de lujo': 'villa',
  'local comercial': 'office', 'oficina': 'office',
  'nave industrial': 'office', 'negocio': 'office',
  'edificio': 'office', 'hotel': 'office', 'almacén': 'office',
  'garaje': 'office', 'parking': 'office', 'trastero': 'office',
  'terreno urbano': 'land', 'terreno urbanizable': 'land',
  'terreno rústico': 'land', 'terreno rural': 'land', 'parcela': 'land',
  'finca rústica': 'land', 'finca cinegética': 'land',
}

const num = (v) => {
  const n = Number(String(v || '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

// El feed trae precios con decimales sueltos (19209.99, 49349.99118753305).
// En la web quedan feísimos, así que se redondean al euro.
const euros = (v) => {
  const n = num(v)
  return n === null ? null : Math.round(n)
}

// Inmovilla separa los párrafos de la descripción con "~~" (a veces "~ ~").
// Sin traducirlo, el texto sale en la web con las tildes de gusano a la vista.
const parrafos = (s) => (s || '')
  .replace(/~\s*~/g, '\n\n')
  .replace(/[ \t]*\n[ \t]*/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

function mapProperty(f) {
  const esAlquiler = /alquil/i.test(f.accion || '')
  const price = esAlquiler
    ? (euros(f.precioalq) || euros(f.precioinmo))
    : (euros(f.precioinmo) || euros(f.precioalq))

  const tipo = (f.tipo_ofer || '').trim()
  const ciudad = (f.ciudad || '').trim()
  const zona = (f.zona || '').trim()

  const images = []
  for (let i = 1; i <= 40; i++) {
    const u = (f[`foto${i}`] || '').trim()
    if (u) images.push(u)
  }

  // Título: el del feed si existe; si no, uno construido.
  const title = (f.titulo1 || '').trim() || [tipo, ciudad && `en ${ciudad}`].filter(Boolean).join(' ')

  // El feed reparte habitaciones entre dos campos según el tipo de ficha.
  const bedrooms = (Number(f.habdobles) || 0) + (Number(f.habitaciones) || 0)

  return {
    external_ref: (f.ref || '').trim(),
    source: 'inmovilla',
    title: title.slice(0, 300),
    description: parrafos(f.descrip1) || null,
    price,
    location: [zona, ciudad].filter(Boolean).join(', ') || ciudad || null,
    zone: zona || null,
    city: ciudad || null,
    province: (f.provincia || '').trim() || null,
    property_type: TIPOS[tipo.toLowerCase()] || 'house',
    channel: esAlquiler ? 'alquiler' : 'exp',
    bedrooms: bedrooms || null,
    bathrooms: (Number(f.banyos) || 0) || null,
    area_sqm: num(f.m_cons) || num(f.m_uties) || num(f.m_parcela),
    main_image: images[0] || null,
    images,
    agent_name: (f.agente || '').trim() || null,
    agent_email: (f.email_agente || '').trim() || null,
    agent_phone: (f.tlf_agente || '').trim() || null,
    is_active: true,
    is_featured: false,
    imported_at: new Date().toISOString(),
  }
}

// ── Ejecución ────────────────────────────────────────────
async function main() {
  console.log(`Descargando el feed...`)
  const res = await fetch(XML_URL)
  if (!res.ok) {
    console.error(`El feed respondió ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const xml = await res.text()
  console.log(`  ${(xml.length / 1048576).toFixed(1)} MB recibidos.`)

  const blocks = splitProperties(xml)
  console.log(`  ${blocks.length} propiedades en el feed.`)

  let rows = blocks.map(b => mapProperty(fields(b)))

  // Filtros
  if (PROVINCIA && PROVINCIA !== 'ALL') {
    rows = rows.filter(r => (r.province || '').toUpperCase() === PROVINCIA)
  }
  if (CIUDAD) {
    rows = rows.filter(r => (r.city || '').toLowerCase().includes(CIUDAD))
  }

  // Descarta lo que no sirve para publicar
  const antes = rows.length
  rows = rows.filter(r => r.external_ref && r.price && r.title)
  const descartadas = antes - rows.length

  rows.sort((a, b) => (b.price || 0) - (a.price || 0))
  if (LIMIT) rows = rows.slice(0, LIMIT)

  const conFoto = rows.filter(r => r.main_image).length
  console.log(`\nFiltro: provincia=${PROVINCIA}${CIUDAD ? ` ciudad=${CIUDAD}` : ''}${LIMIT ? ` limite=${LIMIT}` : ''}`)
  console.log(`  ${rows.length} propiedades a importar (${conFoto} con foto)`)
  if (descartadas) console.log(`  ${descartadas} descartadas por no tener referencia, precio o titulo`)

  console.log('\nMuestra:')
  for (const r of rows.slice(0, 5)) {
    console.log(`  ${r.external_ref.padEnd(10)} ${String(r.price).padStart(9)} EUR  ${(r.city || '').padEnd(18)} ${r.images.length} fotos  ${r.title.slice(0, 45)}`)
  }

  if (!WRITE) {
    console.log('\nSIMULACRO — no se ha escrito nada. Añade --write para importar de verdad.')
    return
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const CHUNK = 100

  // Qué referencias existen ya. No usamos ON CONFLICT sobre external_ref
  // porque su índice único es parcial y Postgres no lo acepta ahí; en su
  // lugar separamos altas de actualizaciones y hacemos el upsert por `id`,
  // que sí es la clave primaria.
  console.log('\nComprobando qué propiedades ya existen...')
  const existentes = new Map()
  const refs = rows.map(r => r.external_ref)
  for (let i = 0; i < refs.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('properties')
      .select('id, external_ref')
      .in('external_ref', refs.slice(i, i + CHUNK))

    if (error) {
      console.error(`  ERROR consultando existentes: ${error.message}`)
      if (/could not find the '.*' column|column .* does not exist/i.test(error.message)) {
        console.error('\n  → Falta la migración. Ejecuta db/sql_import_inmovilla.sql en Supabase.')
      }
      process.exit(1)
    }
    for (const r of data || []) existentes.set(r.external_ref, r.id)
  }

  const nuevas = rows.filter(r => !existentes.has(r.external_ref))
  // Al actualizar NO tocamos is_featured: si has marcado una propiedad como
  // destacada desde el admin, la siguiente importación no debe borrártelo.
  const actualizar = rows
    .filter(r => existentes.has(r.external_ref))
    .map(({ is_featured, ...r }) => ({ ...r, id: existentes.get(r.external_ref) }))

  console.log(`  ${nuevas.length} nuevas · ${actualizar.length} a actualizar`)

  let altas = 0, updates = 0, fallos = 0

  for (let i = 0; i < nuevas.length; i += CHUNK) {
    const lote = nuevas.slice(i, i + CHUNK)
    const { error } = await supabase.from('properties').insert(lote)
    if (error) { console.error(`  ERROR insertando: ${error.message}`); fallos += lote.length; continue }
    altas += lote.length
    console.log(`  altas ${altas}/${nuevas.length}`)
  }

  for (let i = 0; i < actualizar.length; i += CHUNK) {
    const lote = actualizar.slice(i, i + CHUNK)
    const { error } = await supabase.from('properties').upsert(lote, { onConflict: 'id' })
    if (error) { console.error(`  ERROR actualizando: ${error.message}`); fallos += lote.length; continue }
    updates += lote.length
    console.log(`  actualizadas ${updates}/${actualizar.length}`)
  }

  console.log(`\nListo: ${altas} altas, ${updates} actualizadas${fallos ? `, ${fallos} fallidas` : ''}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
