FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci

FROM deps AS source
COPY . .

FROM source AS api
EXPOSE 4000
CMD ["npm", "run", "dev:api"]

FROM source AS web
EXPOSE 5173
CMD ["npm", "run", "dev:web:docker"]
