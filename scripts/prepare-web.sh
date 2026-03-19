#!/bin/bash
# Prepare web build output for deployment (GitHub Pages / static hosting).
# Run after `npx expo export --platform web`.
set -euo pipefail

DIST="dist"
PUBLIC="public"

# Copy public assets (manifest, icons) into dist
if [ -d "$PUBLIC" ]; then
  cp -r "$PUBLIC"/* "$DIST"/
fi

# Generate PWA icons from source icon if sips is available (macOS)
if command -v sips &>/dev/null && [ -f assets/icon.png ]; then
  sips -z 192 192 assets/icon.png --out "$DIST/icon-192.png" >/dev/null 2>&1 || true
  sips -z 512 512 assets/icon.png --out "$DIST/icon-512.png" >/dev/null 2>&1 || true
fi

# Inject PWA manifest link and meta tags into index.html
if [ -f "$DIST/index.html" ]; then
  # Only inject if not already present
  if ! grep -q 'manifest.json' "$DIST/index.html"; then
    sed -i.bak 's|</head>|  <link rel="manifest" href="/manifest.json" />\n  <meta name="theme-color" content="#4ade80" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n  <meta name="apple-mobile-web-app-title" content="CalTrack AI" />\n  <link rel="apple-touch-icon" href="/icon-192.png" />\n  <meta name="description" content="AI-powered calorie and macro tracker — snap a photo, get instant nutrition data" />\n</head>|' "$DIST/index.html"
    rm -f "$DIST/index.html.bak"
  fi
fi

# Create .nojekyll for GitHub Pages (prevents ignoring _expo directory)
touch "$DIST/.nojekyll"

echo "Web build prepared for deployment in $DIST/"
