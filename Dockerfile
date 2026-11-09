FROM oven/bun:1.4.4 AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN --network=host bun install --frozen-lockfile

FROM dependencies AS integration
WORKDIR /app
COPY . .
ENV DATABASE_URL=postgresql://build@127.0.0.1:5432/build?schema=public
RUN bun run db:generate

FROM dependencies AS builder
WORKDIR /app
COPY . .
ENV DATABASE_URL=postgresql://build@127.0.0.1:5432/build?schema=public
RUN bun run build

FROM oven/bun:1.4.4 AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY package.json bun.lock ./
RUN --network=host bun install --frozen-lockfile --production --ignore-scripts
COPY --from=dependencies /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/lib/database-url.ts ./src/lib/database-url.ts
EXPOSE 3000
CMD ["sh", "-c", "bun run db:migrate:deploy && bun run start"]
