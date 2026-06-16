# Frontend Dockerfile - Angular served directly by Node
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve && \
    addgroup -S okane && adduser -S okane -G okane

COPY --from=builder /app/dist/Okane-frontend/browser ./dist

RUN if [ -f /app/dist/index.csr.html ]; then \
      cp /app/dist/index.csr.html /app/dist/index.html; \
    fi && \
    chown -R okane:okane /app

USER okane

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
