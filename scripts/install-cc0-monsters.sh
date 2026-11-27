#!/usr/bin/env bash
set -euo pipefail

TARGET="www/assets/monsters"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$TARGET"

# Direct downloads published by SpriteCanvas, avoiding itch.io's anti-bot file redirect.
for creature in slime mushroom goblin golem; do
  archive="$WORK/$creature.zip"
  url="https://spritecanvas.com/free/$creature.zip"
  echo "Downloading CC0 $creature atlas from SpriteCanvas..."
  curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 "$url" --output "$archive"
  unzip -tq "$archive"
  unzip -oq "$archive" -d "$TARGET"
  folder="$TARGET/$creature"
  if [[ ! -d "$folder" ]]; then
    folder="$(find "$TARGET" -type f -name "$creature-idle.png" -printf '%h\n' | head -n 1)"
  fi
  if [[ -z "$folder" || ! -f "$folder/$creature-idle.png" || ! -f "$folder/$creature-idle.json" ]]; then
    echo "Missing expected $creature idle sprite or atlas after extraction."
    find "$TARGET" -maxdepth 4 -type f | sort | head -n 120
    exit 1
  fi
  for animation in idle walk attack hurt death; do
    test -s "$folder/$creature-$animation.png"
    test -s "$folder/$creature-$animation.json"
  done
  if [[ ! -s "$folder/LICENSE.txt" ]] || ! grep -Eiq 'CC0|Creative Commons Zero|Public Domain' "$folder/LICENSE.txt"; then
    echo "CC0 license file missing or unrecognised for $creature."
    exit 1
  fi
  node - "$folder/$creature-idle.json" "$creature" <<'NODE'
const fs=require('fs'),file=process.argv[2],name=process.argv[3],a=JSON.parse(fs.readFileSync(file,'utf8'));
const frames=Object.keys(a.frames||{});
if(!frames.length || !a.meta || a.meta.license!=='CC0-1.0') throw new Error('Invalid or non-CC0 '+name+' atlas');
console.log(JSON.stringify({creature:name,frames:frames.length,cell:a.meta.cell,fps:a.meta.fps,license:a.meta.license,first:frames[0]}));
NODE
done
echo "All four CC0 monster animation packs passed ZIP, atlas, and license checks."
find "$TARGET" -maxdepth 2 -type f -name '*-idle.png' -printf '%P %s bytes\n' | sort
