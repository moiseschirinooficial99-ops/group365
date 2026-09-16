export async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  model = 'claude-haiku-4-5-20251001',
  maxTokens = 1000,
  responseFormat?: 'json_object'
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada')

  // Anthropic no acepta role "system" dentro de messages: se extrae el/los
  // mensajes de sistema iniciales y se pasan aparte como `system`.
  const systemParts: string[] = []
  const chatMessages: Array<{ role: string; content: string }> = []
  for (const m of messages) {
    if (m.role === 'system') systemParts.push(m.content)
    else chatMessages.push(m)
  }
  const system = [
    ...systemParts,
    ...(responseFormat === 'json_object'
      ? ['Responde unicamente con un objeto JSON valido, sin texto adicional ni markdown.']
      : []),
  ].join('\n\n') || undefined

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: chatMessages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}
