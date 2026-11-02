#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# Verificación de producción — estándar MACD STUDIOS
# Solo lectura: no crea leads ni toca datos.
# Uso:  bash scripts/verificar-produccion.sh [URL]
# ═══════════════════════════════════════════════════════
B="${1:-https://www.group360iniciativas.com}"
OK=0; KO=0
pass(){ printf "  \033[32m✔\033[0m %s\n" "$1"; OK=$((OK+1)); }
fail(){ printf "  \033[31m✘\033[0m %s  → %s\n" "$1" "$2"; KO=$((KO+1)); }
code(){ curl -s -o /dev/null -w "%{http_code}" "$@"; }
expect(){ local name="$1" want="$2"; shift 2; local got; got=$(code "$@"); [ "$got" = "$want" ] && pass "$name ($got)" || fail "$name" "esperaba $want, dio $got"; }

echo "Verificando $B"
echo "── Páginas"
for p in / /compras /alquileres /inversores /inversores/register /privacidad /aviso-legal /cookies /admin/login; do
  expect "$p" 200 -L "$B$p"
done
t=$(curl -s -o /dev/null -w "%{time_total}" "$B/"); awk "BEGIN{exit !($t<2.5)}" && pass "Portada en ${t}s" || fail "Portada lenta" "${t}s"

echo "── SEO"
n=$(curl -s "$B/sitemap.xml" | grep -o "<loc>" | wc -l)
[ "$n" -gt 20 ] && pass "Sitemap con $n URLs" || fail "Sitemap" "solo $n URLs"
PID=$(curl -s "$B/api/properties?view=card" | grep -o '"id":"[0-9a-f-]\{36\}"' | head -1 | cut -d'"' -f4)
if [ -n "$PID" ]; then
  html=$(curl -s "$B/propiedades/$PID")
  echo "$html" | grep -q '<title>GROUP 360 INICIATIVAS | Asesoría' && fail "Ficha con título genérico" "$PID" || pass "Ficha con título propio"
  echo "$html" | grep -q 'RealEstateListing' && pass "Ficha con datos estructurados" || fail "Ficha sin JSON-LD" "$PID"
  echo "$html" | grep -q 'Cargando\.\.\.' && fail "Ficha renderiza en cliente" "Google ve 'Cargando...'" || pass "Ficha renderizada en servidor"
else
  fail "No se pudo leer el catálogo" "/api/properties?view=card"
fi

echo "── Rendimiento API"
sz=$(curl -s -o /dev/null -w "%{size_download}" "$B/api/properties?view=card")
[ "$sz" -lt 300000 ] && pass "Catálogo ligero ($((sz/1024)) KB)" || fail "Catálogo pesado" "$((sz/1024)) KB"
# Vercel se queda el s-maxage y no lo muestra; lo fiable es X-Vercel-Cache.
curl -s -o /dev/null "$B/api/properties?view=card"
vc=$(curl -s -D - -o /dev/null "$B/api/properties?view=card" | grep -i "^x-vercel-cache" | awk '{print $2}' | tr -d '')
case "$vc" in HIT|STALE|PRERENDER) pass "Catálogo cacheado en CDN ($vc)";; *) fail "Catálogo sin caché" "X-Vercel-Cache: ${vc:-ninguna}";; esac

echo "── Seguridad"
expect "Lead sin contacto rechazado" 400 -X POST "$B/api/leads" -H 'Content-Type: application/json' -d '{"name":"verificacion"}'
expect "Lead trampa ignorado" 200 -X POST "$B/api/leads" -H 'Content-Type: application/json' -d '{"email":"bot@verificacion.test","website":"x"}'
expect "Renovar token sin auth" 401 "$B/api/admin/refresh-wa-token"
expect "Webhook WhatsApp sin firma" 401 -X POST "$B/api/whatsapp" -H 'Content-Type: application/json' -d '{}'
expect "API leads sin auth" 401 "$B/api/leads"
expect "Panel admin sin sesión → login" 307 "$B/admin"
expect "Bypass de middleware bloqueado" 307 -H "x-middleware-subrequest: middleware:middleware:middleware:middleware:middleware" "$B/admin"
priv=$(curl -s "$B/api/investment-opportunities" | grep -o '"is_public":false' | wc -l)
[ "$priv" -eq 0 ] && pass "Oportunidades privadas ocultas" || fail "Oportunidades privadas expuestas" "$priv"

echo
[ $KO -eq 0 ] && printf "\033[32mTodo OK (%d comprobaciones)\033[0m\n" $OK || printf "\033[31m%d fallos\033[0m de %d\n" $KO $((OK+KO))
exit $KO
