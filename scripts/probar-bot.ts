// ═══════════════════════════════════════════════════════
// SIMULADOR DEL BOT DE WHATSAPP — pruebas antes de hablar con clientes reales
//
// Una IA hace de cliente (comprador, vendedor, inversor, objeciones, curioso
// que llega de un anuncio…) y conversa con Alejandro usando EXACTAMENTE el
// mismo prompt y modelo que producción. No envía nada por WhatsApp ni toca la
// base de datos. Coste: céntimos (modelo Haiku).
//
// Uso (desde la raíz del repo, con ANTHROPIC_API_KEY en .env.local):
//   npx tsx scripts/probar-bot.ts            → los 6 clientes, estilo según su número
//   npx tsx scripts/probar-bot.ts B          → todos con el estilo B
//   npx tsx scripts/probar-bot.ts A vendedor → solo el cliente "vendedor" con estilo A
// ═══════════════════════════════════════════════════════
import fs from 'node:fs'
import { callAnthropic } from '../app/api/anthropic'
import { buildSystemPrompt, toWhatsAppFormat } from '../lib/botPrompt'
import { BOT_STYLES, styleFor } from '../lib/botKnowledge'

// Solo se lee ANTHROPIC_API_KEY del .env.local (nunca se imprime)
if (!process.env.ANTHROPIC_API_KEY && fs.existsSync('.env.local')) {
  const line = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).find(l => l.startsWith('ANTHROPIC_API_KEY='))
  if (line) process.env.ANTHROPIC_API_KEY = line.slice('ANTHROPIC_API_KEY='.length).replace(/^["']|["']$/g, '').trim()
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Falta ANTHROPIC_API_KEY en .env.local')
  process.exit(1)
}

const MODEL = 'claude-haiku-4-5-20251001' // el mismo que usa el webhook
const TURNOS = 5

type Cliente = { id: string; phone: string; perfil: string; primerMensaje: string; anuncio?: { headline: string; body: string } }

const CLIENTES: Cliente[] = [
  { id: 'comprador', phone: '34611000001', primerMensaje: 'Hola, busco piso en Cambrils',
    perfil: 'Marta, 41 años, de Lleida. Busca segunda residencia en Cambrils para veranos, presupuesto 250.000 €, necesita hipoteca del 70 %. Desconfía un poco de las inmobiliarias. Responde con frases cortas.' },
  { id: 'vendedor', phone: '34611000002', primerMensaje: 'Buenas, cuánto vale mi piso en Salou?',
    perfil: 'Jordi, 58 años. Heredó un piso de 2 habitaciones en Salou con su hermana y quieren venderlo. Tiene licencia turística. Piensa venderlo él solo por Idealista para no pagar comisión.' },
  { id: 'inversor', phone: '34611000003', primerMensaje: 'Me interesa invertir en NPL, cómo funciona?',
    perfil: 'Carlos, 45 años, empresario con 80.000 € ahorrados. Ha oído hablar de NPL pero le da miedo perder dinero y quiere saber qué rentabilidad real puede esperar y en cuánto tiempo.' },
  { id: 'objecion_caro', phone: '34611000004', primerMensaje: 'He visto el ático de Salou pero me parece carísimo',
    perfil: 'Laura, 36 años. Le gusta un ático en Salou pero cree que está caro respecto a otros que ha visto. Dice que "lo tiene que pensar". Si la convencen con argumentos, acepta una visita.' },
  { id: 'anuncio_alquiler', phone: '34611000005', primerMensaje: 'Hola! Vi vuestro anuncio',
    anuncio: { headline: 'Rentabiliza tu apartamento en la Costa Dorada', body: 'Gestionamos tu alquiler vacacional de principio a fin.' },
    perfil: 'Pere, 63 años, tiene un apartamento en La Pineda que usa poco. Llega desde un anuncio de Facebook. Quiere saber si puede alquilarlo a turistas y cuánto ganaría. No sabe nada de licencias.' },
  { id: 'extranjero', phone: '34611000006', primerMensaje: 'Hello, do you speak English? I want to buy in Tarragona',
    perfil: 'Tom, británico de 52 años, quiere comprar una casa cerca de la playa en Tarragona para jubilarse. Pregunta por la Golden Visa y por los impuestos. Escribe en inglés.' },
]

async function simular(c: Cliente, estiloForzado?: string) {
  const style = BOT_STYLES.find(s => s.id === estiloForzado) || styleFor(c.phone)
  const historial: { role: 'user' | 'assistant'; content: string }[] = []
  const salida: string[] = [`\n════════ ${c.id.toUpperCase()} · estilo ${style.id} (${style.nombre}) ════════`]
  let mensajeCliente = c.primerMensaje

  for (let turno = 0; turno < TURNOS; turno++) {
    historial.push({ role: 'user', content: mensajeCliente })
    salida.push(`\n👤 Cliente: ${mensajeCliente}`)

    const system = buildSystemPrompt({
      propsContext: '(Simulación: no hay catálogo cargado. Si preguntan por una propiedad concreta, ofrece que José Luis envíe la ficha.)',
      availContext: 'Libre de lunes a viernes de 10:00 a 14:00 y de 16:00 a 19:00.',
      style,
      isNewContact: turno === 0,
      adRef: turno === 0 ? c.anuncio : null,
    })
    const respuesta = toWhatsAppFormat(await callAnthropic([{ role: 'system', content: system }, ...historial], MODEL, 250))
    historial.push({ role: 'assistant', content: respuesta })
    salida.push(`🤖 Alejandro: ${respuesta}`)

    // La IA-cliente contesta siguiendo su perfil
    mensajeCliente = await callAnthropic([
      { role: 'system', content: `Eres un cliente real escribiendo por WhatsApp a una inmobiliaria. Perfil: ${c.perfil}\nResponde SOLO con tu siguiente mensaje de WhatsApp, corto y natural (1-2 frases), sin comillas. Si ya has quedado para una llamada o visita, despídete.` },
      ...historial.map(m => ({ role: m.role === 'user' ? 'assistant' : 'user', content: m.content })),
    ], MODEL, 150)
  }

  // Métricas rápidas
  const bot = historial.filter(m => m.role === 'assistant').map(m => m.content)
  const palabras = Math.round(bot.reduce((a, t) => a + t.split(/\s+/).length, 0) / bot.length)
  const preguntas = (bot.reduce((a, t) => a + (t.match(/\?/g) || []).length, 0) / bot.length).toFixed(1)
  const prohibidas = bot.join(' ').match(/(?<!(infra|sobre) )garantizad|blindad|riesgo cero|sin riesgo|no pagas? (a )?abogados|\*\*|golden visa (est|sig)|c[óo]digo sms/gi) || []
  salida.push(`\n📊 Media ${palabras} palabras/mensaje · ${preguntas} preguntas/mensaje · avisos: ${prohibidas.length ? prohibidas.join(', ') : 'ninguno'}`)
  return { texto: salida.join('\n'), palabras, preguntas: Number(preguntas), avisos: prohibidas.length }
}

;(async () => {
  const [estilo, soloId] = process.argv.slice(2)
  const lista = CLIENTES.filter(c => !soloId || c.id === soloId)
  const informe: string[] = [`# Prueba del bot — ${new Date().toLocaleString('es-ES')}${estilo ? ` · estilo ${estilo}` : ''}`]
  for (const c of lista) {
    try {
      const r = await simular(c, estilo)
      console.log(r.texto)
      informe.push(r.texto)
    } catch (e: any) {
      console.error(`Error con ${c.id}:`, e.message)
    }
  }
  fs.mkdirSync('pruebas-bot', { recursive: true })
  const f = `pruebas-bot/prueba-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`
  fs.writeFileSync(f, informe.join('\n'))
  console.log(`\nGuardado en ${f}`)
})()
