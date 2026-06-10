export function scoreLead(lead: {
  budget_max?: number
  preferred_zone?: string
  investment_timeline?: string
  expected_roi?: number
  source?: string
}): { score: number; redirect: 'exp' | 'personal' | 'direct' } {
  let score = 0
  const budget = Number(lead.budget_max || 0)

  if (budget >= 80000 && budget <= 350000) score += 30
  else if (budget > 350000) score += 22
  else score += 8

  const topZones = ['madrid', 'barcelona', 'marbella', 'costa del sol', 'valencia', 'alicante']
  if (lead.preferred_zone) {
    const zone = lead.preferred_zone.toLowerCase()
    if (topZones.some(z => zone.includes(z))) score += 25
  }

  const roi = Number(lead.expected_roi || 0)
  if (roi >= 4 && roi <= 7) score += 25

  if (lead.source === 'inversores') score += 20

  const redirect = score >= 70 ? 'exp' : score >= 40 ? 'personal' : 'direct'
  return { score, redirect }
}
