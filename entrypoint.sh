#!/bin/sh

set -e

node ../confd/generate-config.js --indocker

# Check if env-config.js contains "{{" or has size 0
if grep -q '{{' env-config.js || [ ! -s env-config.js ]; then
  echo "Error: env-config.js contains '{{' or is empty"
  exit 1
fi

# Check if index.html contains "{{" or has size 0
if grep -q '{{' index.html || [ ! -s index.html ]; then
  echo "Error: index.html contains '{{' or is empty"
  exit 1
fi

echo "Done with confd"


PUBLIC_URL_NORMALIZED="${CONFIGURATION_PUBLIC_URL:-}"

if [ "$PUBLIC_URL_NORMALIZED" = "." ]; then
  PUBLIC_URL_NORMALIZED=""
fi

if [ -n "$PUBLIC_URL_NORMALIZED" ]; then
  PUBLIC_URL_NORMALIZED="${PUBLIC_URL_NORMALIZED%/}"
fi

case "$PUBLIC_URL_NORMALIZED" in
  */static/js)
    PUBLIC_URL_NORMALIZED="${PUBLIC_URL_NORMALIZED%/static/js}"
    ;;
esac

ESCAPED_PUBLIC_URL="$(printf '%s' "$PUBLIC_URL_NORMALIZED" | sed 's/[^a-zA-Z0-9.]/\\&/g')"

echo "Running SED command -->" 's/{PUBLIC_URL_PLACEHOLDER}/'"$ESCAPED_PUBLIC_URL"'/g'

find ./static/js -name '*.js' -exec \
  sed -i 's/{PUBLIC_URL_PLACEHOLDER}/'"$ESCAPED_PUBLIC_URL"'/g' {} +

echo "Done with SED command"


echo "Running NGINX ..."

nginx -g 'daemon off;'
