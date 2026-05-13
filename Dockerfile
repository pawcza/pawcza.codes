# ----- Base image -----
FROM node:20-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm
WORKDIR /app

# ----- Dependencies -----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ----- Build -----
FROM base AS build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build

# ----- Production runtime -----
FROM base AS prod
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["pnpm", "run", "start"]
