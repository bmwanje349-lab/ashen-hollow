#!/usr/bin/env bash
set -euo pipefail

ASSET_URL="https://spritecanvas.com/free/moss-knight.zip"
TARGET="www/assets"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

mkdir -p "$TARGET"
echo "Downloading CC0 Moss Knight sprite animation archive..."
curl --fail --location --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 "$ASSET_URL" --output "$TMP"
unzip -tq "$TMP"
unzip -oq "$TMP" -d "$TARGET"

ROOT="$TARGET/moss-knight"
if [[ ! -d "$ROOT" ]]; then
  ROOT="$(find "$TARGET" -type f -name 'moss-knight-idle.png' -printf '%h\n' | head -n 1)"
fi
if [[ -z "$ROOT" || ! -f "$ROOT/moss-knight-idle.png" || ! -f "$ROOT/moss-knight-idle.json" ]]; then
  echo "Expected Moss Knight atlas files not found after extraction."
  find "$TARGET" -maxdepth 4 -type f | sort | head -n 100
  exit 1
fi
for animation in idle walk attack roll jump hurt death; do
  test -s "$ROOT/moss-knight-$animation.png"
  test -s "$ROOT/moss-knight-$animation.json"
done
test -s "$ROOT/LICENSE.txt"
echo "CC0 sprite pack installed at $ROOT"
find "$ROOT" -maxdepth 1 -type f -printf '%f %s bytes\n' | sort
echo "Atlas schema sample:"
node - "$ROOT/moss-knight-idle.json" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const atlas = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify({
  topLevel: Object.keys(atlas),
  meta: atlas.meta || null,
  firstFrame: atlas.frames ? Object.entries(atlas.frames)[0] : null
}, null, 2));
NODE
