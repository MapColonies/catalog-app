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


echo "Running SED command -->" 's/{PUBLIC_URL_PLACEHOLDER}/'"$(echo "$CONFIGURATION_PUBLIC_URL" | sed 's/[^a-zA-Z0-9.]/\\&/g')"'/g'

find ./static/js -name '*.js' -exec \
  sed -i 's/{PUBLIC_URL_PLACEHOLDER}/'"$(echo "$CONFIGURATION_PUBLIC_URL" | sed 's/[^a-zA-Z0-9.]/\\&/g')"'/g' {} +

echo "Done with SED command"


echo "Running NGINX ..."

nginx -g 'daemon off;'
