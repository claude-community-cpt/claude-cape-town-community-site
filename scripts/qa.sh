#!/usr/bin/env bash
# QA check for the live site. Prints PASS/FAIL per check, exits 1 on any failure.
#
#   scripts/qa.sh                 check https://claudecapetown.com
#   scripts/qa.sh --retries 12    wait (10s apart) until this commit is the one that is live
#   BASE=https://example.com scripts/qa.sh   check a different host
set -u
BASE="${BASE:-https://claudecapetown.com}"
HOST="${BASE#https://}"
RETRIES=1
[ "${1:-}" = "--retries" ] && RETRIES="${2:-1}"
# In GitHub Actions this is the commit that was just deployed.
WANT="${GITHUB_SHA:-}"; WANT="${WANT:0:12}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
LIVE="$TMP/live.html"
fail=0; pass=0
ok()   { pass=$((pass+1)); printf 'PASS  %s\n' "$1"; }
bad()  { fail=$((fail+1)); printf 'FAIL  %s: %s\n' "$1" "$2"; }
skip() { printf 'SKIP  %s: %s\n' "$1" "$2"; }
get()  { curl -sS -o "$2" -w '%{http_code}' --max-time 20 -H 'Cache-Control: no-cache' "$1" 2>/dev/null; }

echo "QA: $BASE  ($(date '+%Y-%m-%d %H:%M %Z'))"
echo "----------------------------------------------"

# 1. DNS
if command -v dig >/dev/null; then
  a=$(dig +short A "$HOST" @1.1.1.1 | sort | tr '\n' ' ')
  want="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153 "
  [ "$a" = "$want" ] && ok "DNS apex A records point at GitHub Pages" || bad "DNS apex A records" "got: $a"
  c=$(dig +short CNAME "www.$HOST" @1.1.1.1)
  case "$c" in
    claude-community-cpt.github.io.) ok "DNS www CNAME points at the org's GitHub Pages" ;;
    # The old personal-account address still serves the site, so it does not fail the deploy,
    # but it is not accepted as correct. Change the record at the registrar to clear this.
    *.github.io.) skip "DNS www CNAME" "WARNING: still $c, must become claude-community-cpt.github.io." ;;
    *) bad "DNS www CNAME" "got: $c" ;;
  esac
else
  skip "DNS" "dig not installed"
fi

# 2. Redirects
loc=$(curl -sSI --max-time 20 "http://$HOST/" 2>/dev/null | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')
[ "$loc" = "$BASE/" ] && ok "HTTP redirects to HTTPS" || bad "HTTP redirect" "Location: ${loc:-none}"
loc=$(curl -sSI --max-time 20 "https://www.$HOST/" 2>/dev/null | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')
[ "$loc" = "$BASE/" ] && ok "www redirects to apex" || bad "www redirect" "Location: ${loc:-none}"

# 3. Certificate
exp=$(echo | openssl s_client -servername "$HOST" -connect "$HOST:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$exp" ]; then
  if date -j >/dev/null 2>&1; then exp_s=$(date -j -f '%b %d %T %Y %Z' "$exp" +%s 2>/dev/null); else exp_s=$(date -d "$exp" +%s 2>/dev/null); fi
  days=$(( (exp_s - $(date +%s)) / 86400 ))
  [ "$days" -gt 14 ] && ok "TLS certificate valid for $days more days" || bad "TLS certificate" "expires in $days days ($exp)"
else
  bad "TLS certificate" "could not read certificate"
fi

# 4. The live home page is up and, in CI, is the build of this commit
code=000; live_build=""
for i in $(seq 1 "$RETRIES"); do
  code=$(get "$BASE/" "$LIVE")
  live_build=$(grep -oE '<meta name="build" content="[^"]*"' "$LIVE" 2>/dev/null | sed 's/.*content="//;s/"$//')
  if [ "$code" = "200" ] && { [ -z "$WANT" ] || [ "$live_build" = "$WANT" ]; }; then break; fi
  [ "$i" -lt "$RETRIES" ] && sleep 10
done
if [ "$code" != "200" ]; then bad "Home page" "HTTP $code"
elif [ -n "$WANT" ] && [ "$live_build" != "$WANT" ]; then bad "Deploy has not landed" "live build is ${live_build:-unknown}, expected $WANT"
else ok "Home page is live (build ${live_build:-unknown})"; fi
[ -s "$LIVE" ] || { echo "no page to check further"; exit 1; }

# 5. Every page and key file responds
for path in / /events/ /gallery/ /demos/ /speak/ /partner/ /join/ /privacy/ /mixer/ /robots.txt /sitemap-index.xml /og.png /.well-known/security.txt; do
  code=$(get "$BASE$path" /dev/null)
  [ "$code" = "200" ] && ok "$path responds" || bad "$path" "HTTP $code"
done
code=$(get "$BASE/this-page-does-not-exist/" "$TMP/404.html")
{ [ "$code" = "404" ] && grep -q "wandered off" "$TMP/404.html"; } && ok "Unknown pages get the site's own 404" || bad "404 page" "HTTP $code"

# 6. Security policy is in the page
grep -q 'http-equiv="Content-Security-Policy"' "$LIVE" && ok "Content Security Policy present" || bad "Content Security Policy" "missing"

# 7. Everything the home page loads from this site exists
n=0; broken=0
while IFS= read -r ref; do
  n=$((n+1)); code=$(get "$BASE$ref" /dev/null)
  [ "$code" = "200" ] || { broken=$((broken+1)); echo "      $code  $ref"; }
done < <(grep -oE '(src|href)="/(_astro|fonts)/[^"]+"' "$LIVE" | sed -E 's/^(src|href)="//;s/"$//' | sort -u)
[ "$broken" = 0 ] && ok "All $n home page assets load" || bad "Assets" "$broken of $n failed"

# 8. External links respond (LinkedIn and Luma block bots; any HTTP reply counts)
n=0; broken=0
while IFS= read -r url; do
  n=$((n+1)); code=$(curl -sS -o /dev/null -w '%{http_code}' -L --max-time 20 -A 'Mozilla/5.0 (qa-check)' "$url" 2>/dev/null)
  case "$url" in *linkedin.com*|*luma.com*) [ "$code" != "000" ] || { broken=$((broken+1)); echo "      $code  $url"; } ;;
    *) [ "$code" -ge 200 ] && [ "$code" -lt 400 ] || { broken=$((broken+1)); echo "      $code  $url"; } ;; esac
done < <(grep -oE 'href="https://[^"]+"' "$LIVE" | sed 's/href="//;s/"$//' | grep -v "$HOST" | sort -u)
[ "$broken" = 0 ] && ok "All $n external links respond" || bad "External links" "$broken of $n failed"

echo "----------------------------------------------"
echo "$pass passed, $fail failed"
[ "$fail" = 0 ]
