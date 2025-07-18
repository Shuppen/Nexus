#!/usr/bin/env bash
# Обновляет /var/www/nexusgroup/sitemap.xml
# Версия: 2025-06-28

set -euo pipefail

SITE_DIR="/var/www/nexusgroup"
OUT="$SITE_DIR/sitemap.xml"
DOMAIN="https://nexuscomand.com"

cat >"$OUT"<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
XML

find "$SITE_DIR" -type f -iname '*.html' | while read -r file; do
  rel="${file#$SITE_DIR}"                # /index.html  /index.html
  [ "$rel" = "/index.html" ] && rel="/"  # корень сайта
  mdate=$(date -u -r "$file" +%F)        # YYYY-MM-DD
  cat >>"$OUT"<<XML
  <url>
    <loc>${DOMAIN}${rel}</loc>
    <lastmod>${mdate}</lastmod>
  </url>
XML
done

echo '</urlset>' >>"$OUT"
