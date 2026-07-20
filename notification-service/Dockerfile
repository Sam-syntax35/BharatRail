# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Stage 2: Run
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source files from builder
COPY --from=builder /usr/src/app/src ./src

ENV NODE_ENV=production
ENV PORT=4004
ENV HOST=0.0.0.0

EXPOSE 4004

CMD ["node", "src/index.js"]
