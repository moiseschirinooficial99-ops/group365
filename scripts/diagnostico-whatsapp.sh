#!/usr/bin/env bash
# Diagnóstico del bot de WhatsApp (solo lectura, no imprime claves).
# Uso desde la raíz del repo:  bash scripts/diagnostico-whatsapp.sh
set -a; . ./.env.local; set +a
SB="$NEXT_PUBLIC_SUPABASE_URL/rest/v1"
H=(-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

echo "== 1. Últimos mensajes guardados (¿llegan los WhatsApp al webhook?) =="
curl -s "$SB/wa_conversations?select=created_at,direction,status,message&order=created_at.desc&limit=6" "${H[@]}" | cut -c1-900; echo

echo "== 2. Token guardado en Supabase (app_settings) =="
DBTOKEN=$(curl -s "$SB/app_settings?select=value&key=eq.whatsapp_token" "${H[@]}" | sed -n 's/.*"value":"\([^"]*\)".*/\1/p')
curl -s "$SB/app_settings?select=key,expires_at,updated_at&key=eq.whatsapp_token" "${H[@]}"; echo
TOKEN=${DBTOKEN:-$WHATSAPP_TOKEN}

echo "== 3. ¿El token sigue vivo? (Meta) =="
curl -s "https://graph.facebook.com/v26.0/$WHATSAPP_PHONE_ID?fields=display_phone_number,quality_rating,status" -H "Authorization: Bearer $TOKEN"; echo

echo "== 4. ¿La app está suscrita a los mensajes del número? =="
curl -s "https://graph.facebook.com/v26.0/$WHATSAPP_WABA_ID/subscribed_apps" -H "Authorization: Bearer $TOKEN" | cut -c1-400; echo
