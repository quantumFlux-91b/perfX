# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # outputs to /app/dist

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default Nginx page
RUN rm -rf ./*

COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

# OpenShift: allow arbitrary UID to bind to port 8080 (non-root)
RUN chmod -R g+rwx /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:0 /usr/share/nginx/html && \
    chmod -R g+rw /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
