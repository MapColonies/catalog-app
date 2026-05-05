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


# Normalize public URL used by CRA chunks.
# Webpack appends /static/js itself for chunk loading, so if the env value is
# already '/static/js' worker chunks may try to load '/static/js/static/js/...'.
PUBLIC_URL_NORMALIZED="${CONFIGURATION_PUBLIC_URL:-}"

if [ "$PUBLIC_URL_NORMALIZED" = "." ]; then
  PUBLIC_URL_NORMALIZED=""
fi

# Remove trailing slash (except when empty)
if [ -n "$PUBLIC_URL_NORMALIZED" ]; then
  PUBLIC_URL_NORMALIZED="${PUBLIC_URL_NORMALIZED%/}"
fi

# Guard against accidental '/static/js' suffix in deployment values
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
