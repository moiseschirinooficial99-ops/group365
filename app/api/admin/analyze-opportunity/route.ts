import { NextRequest, NextResponse } from 'next/server'

// Analiza un flyer/imagen de oportunidad con IA de visión (OpenAI)
// y devuelve los campos estructurados listos para prellenar el formulario.

const EXTRACTION_PROMPT = `Eres un analista de inversión inmobiliaria de GROUP 360.
Recibes la imagen de un flyer o ficha de una oportunidad de inversión.
Extrae la información y devuélvela EXCLUSIVAMENTE como un objeto JSON válido (sin texto adicional, sin markdown, sin \`\`\`).

Campos a devolver (usa null si un dato no aparece):
{
  "category": una de: "npl" | "reo" | "cesion_remate" | "producto_ocupado" | "fondo".
     Elige la que mejor encaje: NPL=hipoteca impagada/derecho de cobro; REO=activo adjudicado o venta directa de inmueble/sociedad; cesion_remate=subasta desierta; producto_ocupado=inmueble con ocupante; fondo=pool GROUP 360. Si es una venta directa de un inmueble o complejo, usa "reo".
  "title": título corto y comercial (máx 80 caracteres),
  "location": ubicación (ciudad/zona) si aparece,
  "offer_price": precio de venta/oferta en euros como número entero sin símbolos ni puntos (ej: 7000000),
  "property_value": valor de mercado del inmueble en euros como número entero, si aparece,
  "debt_value": valor de la deuda en euros como número entero, solo si es NPL,
  "roi_estimated": rentabilidad/ROI estimado como número (solo el número, sin %), si aparece,
  "estimated_timeline": plazo estimado (texto corto), si aparece,
  "description": resumen profesional de 2-4 frases con los datos clave (nº de edificios, unidades, características, ubicación, estado). Tono de firma de asesoría patrimonial.
}

Reglas:
- Los números SIEMPRE sin puntos de miles ni símbolo de euro (7000000, no "7.000.000 €").
- No inventes datos que no estén en la imagen; usa null.
- Responde solo el JSON.`

export async function POST(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.startsWith('sk-proj-xxxx')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no configurada' }, { status: 500 })
  }

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: 'Falta imageUrl' }, { status: 400 })

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analiza este flyer/ficha de oportunidad y devuelve el JSON.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `OpenAI ${res.status}: ${err.slice(0, 300)}` }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || '{}'

    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Intento de rescate: extraer el primer bloque {...}
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : {}
    }

    // Normalizar categoría
    const validCats = ['npl', 'reo', 'cesion_remate', 'producto_ocupado', 'fondo']
    if (!validCats.includes(parsed.category)) parsed.category = 'reo'

    return NextResponse.json({ ok: true, fields: parsed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
