# Build with Yarn
FROM node:22 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM node:22 AS runner
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY --from=builder /app/dist ./
CMD ["node", "main"]