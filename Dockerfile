FROM node:16.13.0-alpine3.12 AS prepare

# Install dependencies for confd
RUN apk add --no-cache wget

# Download confd
RUN mkdir /confd && \
    wget -O /confd/confd https://github.com/kelseyhightower/confd/releases/download/v0.15.0/confd-0.15.0-linux-amd64 && \
    chmod +x /confd/confd

# Build app
WORKDIR /opt/myapp

# Copy only dependency files first (better layer caching)
COPY package.json yarn.lock ./

# Install production deps
RUN yarn install --frozen-lockfile --production

# Copy source
COPY . .

# Run build
RUN yarn build



FROM nginx:1.27-alpine AS production

# Install Node (needed for confd runtime if required)
RUN apk add --no-cache nodejs

# Update nginx config to run non-root and SPA compatible
RUN sed -i 's#listen       80;#listen       8080;#g' /etc/nginx/conf.d/default.conf && \
    sed -i '/index  index.html index.htm;/a \
        proxy_intercept_errors on;\n\
        error_page 404 = /index.html;\n\
        location = /index.html {\n\
          expires -1;\n\
          add_header "Cache-Control" "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";\n\
        }\n\
        location = /index.htm {\n\
          expires -1;\n\
          add_header "Cache-Control" "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";\n\
        }' /etc/nginx/conf.d/default.conf && \
    sed -i '/user  nginx;/d' /etc/nginx/nginx.conf && \
    sed -i 's,/run/nginx.pid,/tmp/nginx.pid,' /etc/nginx/nginx.conf && \
    sed -i "/^http {/a \
    server_tokens off;\n\
    proxy_temp_path /tmp/proxy_temp;\n\
    client_body_temp_path /tmp/client_temp;\n\
    fastcgi_temp_path /tmp/fastcgi_temp;\n\
    uwsgi_temp_path /tmp/uwsgi_temp;\n\
    scgi_temp_path /tmp/scgi_temp;\n" /etc/nginx/nginx.conf

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy built files
WORKDIR /usr/share/nginx/html
RUN mkdir -p public

COPY --from=prepare /opt/myapp/public/ ./
COPY --from=prepare /opt/myapp/build/ ./

# Copy confd
RUN mv ./confd ../
COPY --from=prepare /confd/confd ../confd/

# Fix permissions for non-root
RUN chgrp -R 0 /var/cache/nginx/ && \
    chmod -R g=u /var/cache/nginx/ && \
    chmod -R g=u /usr/share/nginx/

# Create non-root user
RUN adduser -S user -G root
USER user

ENTRYPOINT ["/entrypoint.sh"]
