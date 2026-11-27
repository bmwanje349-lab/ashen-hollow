#!/usr/bin/env bash
set -euo pipefail

PAGE="https://spritecanvas.itch.io/free-cc0-monster-sprites"
FILE_ENDPOINT="${PAGE}/file/20186865?source=view_game&as_props=1&after_download_lightbox=true"
TMP="$(mktemp)"
WORK="$(mktemp -d)"
trap 'rm -f "$TMP"; rm -rf "$WORK"' EXIT

mkdir -p www/assets/monsters
echo "Requesting current public itch.io file URL..."
curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 90 \
  -H "Accept: application/json" -H "Referer: $PAGE" \
  "$FILE_ENDPOINT" -o "$TMP"
DOWNLOAD_URL="$(node - "$TMP" <<'NODE'
const fs=require('fs');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if (!data || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
  throw new Error('itch.io did not return a secure download URL');
}
process.stdout.write(data.url);
NODE
)"
echo "Downloading CC0 monster archive from its time-limited URL..."
curl --fail --location --silent --show-error --retry 3 --retry-all-errors --connect-timeout 20 --max-time 180 "$DOWNLOAD_URL" -o "$TMP"
unzip -tq "$TMP"
unzip -oq "$TMP" -d "$WORK"

echo "Archive inventory:"
find "$WORK" -type f -printf '%P (%s bytes)\n' | sort | head -n 160

LICENSE_FILE="$(find "$WORK" -type f \( -iname 'LICENSE*' -o -iname 'README*' \) | head -n 1 || true)"
if [[ -z "$LICENSE_FILE" ]]; then
  echo "No license/readme file was found in the archive."
  exit 1
fi
if ! grep -Eiq 'CC0|Creative Commons Zero|Public Domain' "$LICENSE_FILE"; then
  echo "The downloaded license text did not identify this as a CC0/public-domain asset."
  cat "$LICENSE_FILE"
  exit 1
fi

echo "Atlas JSON samples:"
while IFS= read -r atlas; do
  node - "$atlas" <<'NODE'
const fs=require('fs'), file=process.argv[2], a=JSON.parse(fs.readFileSync(file,'utf8'));
const keys=Object.keys(a.frames||{});
console.log(JSON.stringify({file,frames:keys.length,meta:a.meta||null,first:keys[0]||null}));
NODE
done < <(find "$WORK" -type f -name '*.json' | sort | head -n 8)

echo "Monster asset archive passed license and ZIP integrity checks."
