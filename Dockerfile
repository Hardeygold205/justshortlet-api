# syntax=docker/dockerfile:1
FROM node:24-alpine
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json yarn.lock ./
RUN --mount=type=cache,target=/tmp/yarn-cache,uid=1000,gid=1000 \
    yarn install --frozen-lockfile --production --cache-folder /tmp/yarn-cache

COPY --chown=node:node . .
RUN mkdir -p storage/uploads

# Prisma only needs *a* URL to load prisma.config.js; generate never connects
RUN POSTGRES_DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder" \
    REDIS_URL="redis://localhost:6379" \
    JWT_ACCESS_SECRET="build-placeholder" \
    JWT_REFRESH_SECRET="build-placeholder" \
    STORAGE_DRIVER="local" \
    STORAGE_PATH="storage/uploads" \
    CLOUDINARY_API_KEY="build-placeholder" \
    CLOUDINARY_API_SECRET="build-placeholder" \
    yarn prisma:generate

ENV NODE_ENV=production
EXPOSE 5001
CMD ["node", "src/index.js"]