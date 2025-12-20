# Build with Bun
FROM node:22 AS builder
RUN npm i -g bun
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY . .
RUN bun run build

FROM node:22 AS runner
RUN npm i -g bun
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install
COPY --from=builder /app/dist ./
CMD ["node", "main"]