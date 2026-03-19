#!/bin/bash
# Prepare web build output for deployment (GitHub Pages / static hosting).
# Run after `npx expo export --platform web`.
set -euo pipefail

DIST="dist"
PUBLIC="public"
BASE_PATH="/CalTrackAI"

# Copy public assets (manifest, icons, service worker, offline page) into dist
if [ -d "$PUBLIC" ]; then
  cp -r "$PUBLIC"/* "$DIST"/
fi

# Generate PWA icons from source icon (use ImageMagick convert, fall back to sips on macOS)
if [ -f assets/icon.png ]; then
  if command -v convert &>/dev/null; then
    convert assets/icon.png -resize 192x192 "$DIST/icon-192.png" 2>/dev/null || true
    convert assets/icon.png -resize 512x512 "$DIST/icon-512.png" 2>/dev/null || true
  elif command -v sips &>/dev/null; then
    sips -z 192 192 assets/icon.png --out "$DIST/icon-192.png" >/dev/null 2>&1 || true
    sips -z 512 512 assets/icon.png --out "$DIST/icon-512.png" >/dev/null 2>&1 || true
  fi
fi

# Inject PWA manifest link, meta tags, and service worker registration into index.html
if [ -f "$DIST/index.html" ]; then
  # Only inject if not already present
  if ! grep -q 'manifest.json' "$DIST/index.html"; then
    sed -i.bak 's|</head>|  <link rel="manifest" href="'"$BASE_PATH"'/manifest.json" />\n  <meta name="theme-color" content="#4ade80" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n  <meta name="apple-mobile-web-app-title" content="CalTrack AI" />\n  <link rel="apple-touch-icon" href="'"$BASE_PATH"'/icon-192.png" />\n  <meta name="description" content="AI-powered calorie and macro tracker — snap a photo, get instant nutrition data" />\n</head>|' "$DIST/index.html"
    rm -f "$DIST/index.html.bak"
  fi

  # Inject service worker registration before </body> if not already present
  if ! grep -q 'serviceWorker' "$DIST/index.html"; then
    SW_SCRIPT='<script>if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("'"$BASE_PATH"'/sw.js",{scope:"'"$BASE_PATH"'/"}).then(function(r){console.log("SW registered:",r.scope)}).catch(function(e){console.warn("SW registration failed:",e)})})}</script>'
    sed -i.bak "s|</body>|${SW_SCRIPT}\n</body>|" "$DIST/index.html"
    rm -f "$DIST/index.html.bak"
  fi
fi

# Create 404.html for SPA routing on GitHub Pages
# GitHub Pages serves 404.html for unknown paths — redirect to index.html
cp "$DIST/index.html" "$DIST/404.html"

# Create .nojekyll for GitHub Pages (prevents ignoring _expo directory)
touch "$DIST/.nojekyll"

echo "Web build prepared for deployment in $DIST/"
