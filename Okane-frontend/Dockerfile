# Frontend Dockerfile - Angular 21 + Nginx
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm run build

# Production stage - Nginx
FROM nginx:1.27-alpine

# Copy built app
COPY --from=builder /app/dist/Okane-frontend/browser /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -S okane && adduser -S okane -G okane && \
    chown -R okane:okane /usr/share/nginx/html && \
    chown -R okane:okane /var/cache/nginx && \
    chown -R okane:okane /var/log/nginx && \
    chown -R okane:okane /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R okane:okane /var/run/nginx.pid

USER okane

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
