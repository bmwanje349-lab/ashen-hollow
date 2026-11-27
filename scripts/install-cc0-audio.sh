#!/usr/bin/env bash
set -euo pipefail
TARGET="www/assets/audio"
mkdir -p "$TARGET"
echo "Downloading explicitly loopable CC0 dungeon ambience..."
curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 \
  "https://opengameart.org/sites/default/files/dungeon_ambient_1_0.ogg" -o "$TARGET/dungeon-loop.ogg"
echo "Downloading CC0 Dark Shrine Loop..."
curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 \
  "https://opengameart.org/sites/default/files/qubodup-yd-DarkShrineLoop-OpenGameArt.ogg" -o "$TARGET/dark-shrine-loop.ogg"
for file in "$TARGET/dungeon-loop.ogg" "$TARGET/dark-shrine-loop.ogg"; do
  test -s "$file"
  signature="$(head -c 4 "$file")"
  if [[ "$signature" != "OggS" ]]; then echo "Invalid OGG container: $file"; exit 1; fi
  echo "$(basename "$file"): $(wc -c < "$file") bytes, OGG"
done
cat > "$TARGET/README.txt" <<'TXT'
Ashen Hollow soundtrack assets
===============================
dungeon-loop.ogg
  Source: https://opengameart.org/content/loopable-dungeon-ambience
  Author: JaggedStone
  License: CC0 1.0 (public domain)
  Description: Loopable dungeon/cave ambience with low wind and water drips.

dark-shrine-loop.ogg
  Source: https://opengameart.org/content/dark-shrine-loop
  Author: qubodup
  License: CC0 1.0 (public domain)
  Description: Loopable dark shrine/cathedral ambience.

Both assets are CC0 and may be reused commercially without attribution.
TXT
