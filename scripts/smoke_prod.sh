#!/bin/sh
# Production smoke test for Azbuka. Run from the VPS terminal or any machine: sh scripts/smoke_prod.sh
# Read-only: only GET/HEAD/OPTIONS requests. Exits non-zero if any check fails.
HOST="${AZBUKA_HOST:-azbuka.andel-vps.space}"
IP="${AZBUKA_IP:-2.25.108.3}"
fail=0
ok()  { echo "ok   - $1"; }
bad() { echo "FAIL - $1"; fail=1; }
code() { curl -s -o /dev/null -m 15 -w '%{http_code}' "$@" 2>/dev/null; }

[ "$(code "https://$HOST/")" = "200" ] && ok "app served over https (valid certificate)" || bad "https://$HOST/ is not 200 with a valid certificate"
[ "$(code "https://$HOST/api/health")" = "200" ] && ok "/api/health answers 200" || bad "/api/health is not 200"
curl -s -m 15 "https://$HOST/api/health" | grep -q '"status"' && ok "health body looks right" || bad "health body missing status"
loc=$(curl -s -o /dev/null -m 15 -w '%{http_code} %{redirect_url}' "http://$HOST/")
case "$loc" in 30[1278]\ https://*) ok "http redirects to https ($loc)";; *) bad "http does not redirect to https ($loc)";; esac
curl -s -m 15 -D - -o /dev/null "https://$HOST/" | tr -d '\r' | grep -qi '^strict-transport-security' && ok "HSTS header present" || bad "HSTS header missing"
curl -s -m 15 -D - -o /dev/null "https://$HOST/" | tr -d '\r' | grep -qi '^content-security-policy' && ok "CSP header present" || bad "CSP header missing"
curl -s -m 15 "https://$HOST/backend/app/main.py" -o /dev/null -w '%{http_code}' | grep -q '^200$' && bad "backend source is being served" || ok "backend source is not served"
curl -s -m 15 "https://$HOST/.env" -o /dev/null -w '%{http_code}' | grep -q '^200$' && bad ".env is being served" || ok ".env is not served"

evil=$(curl -s -m 15 -D - -o /dev/null -X OPTIONS "https://$HOST/api/v1/me" -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: GET' | tr -d '\r' | grep -i '^access-control-allow-origin')
[ -z "$evil" ] && ok "CORS refuses https://evil.example" || bad "CORS allows a foreign origin: $evil"
good=$(curl -s -m 15 -D - -o /dev/null -X OPTIONS "https://$HOST/api/v1/me" -H "Origin: https://$HOST" -H 'Access-Control-Request-Method: GET' | tr -d '\r' | grep -i "^access-control-allow-origin: https://$HOST")
[ -n "$good" ] && ok "CORS allows the app origin" || bad "CORS does not allow https://$HOST"

# Ports that must not be reachable from outside. (On the VPS itself these may answer on loopback; this checks the public IP.)
for port in 5432 8091; do
  if python3 - "$IP" "$port" <<'PY'
import socket, sys
s = socket.socket(); s.settimeout(5)
try:
    s.connect((sys.argv[1], int(sys.argv[2]))); sys.exit(1)
except OSError:
    sys.exit(0)
PY
  then ok "port $port is closed on $IP"; else bad "port $port is open on $IP"; fi
done

# Other apps on the shared server must keep answering.
for other in twd arova; do
  c=$(code "https://$other.andel-vps.space/")
  case "$c" in 2*|3*|401|403) ok "$other.andel-vps.space still answers ($c)";; *) bad "$other.andel-vps.space returned $c";; esac
done
[ "$fail" = 0 ] && echo "ALL OK" || echo "SOME CHECKS FAILED"
exit "$fail"
