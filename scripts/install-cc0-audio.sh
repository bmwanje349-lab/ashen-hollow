#!/usr/bin/env bash
set -euo pipefail
TARGET="www/assets/audio"
mkdir -p "$TARGET"
echo "Downloading CC0 dungeon ambience..."
curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 \
  "https://opengameart.org/sites/default/files/dungeon002_0.ogg" -o "$TARGET/dungeon-ambience.ogg"
echo "Downloading CC0 dark theme..."
curl --fail --location --silent --show-error --retry 4 --retry-all-errors --connect-timeout 20 --max-time 180 \
  "https://opengameart.org/sites/default/files/theme_0.ogg" -o "$TARGET/dark-theme.ogg"
for file in "$TARGET/dungeon-ambience.ogg" "$TARGET/dark-theme.ogg"; do
  test -s "$file"
  signature="$(head -c 4 "$file")"
  if [[ "$signature" != "OggS" ]]; then echo "Invalid OGG container: $file"; exit 1; fi
  echo "$(basename "$file"): $(wc -c < "$file") bytes, OGG"
done
cat > "$TARGET/README.txt" <<'TXT'
Ashen Hollow soundtrack assets
===============================
dungeon-ambience.ogg
  Source: https://opengameart.org/content/dungeon-ambience
  Author: yd
  License: CC0 1.0 (public domain)
  Description: Background track for exploring a dark dungeon.

dark-theme.ogg
  Source: https://opengameart.org/content/dark-theme
  Author: JaggedStone
  License: CC0 1.0 (public domain)
  Description: Dark/spooky theme.

Both assets are CC0 and may be reused commercially without attribution.
TXT
