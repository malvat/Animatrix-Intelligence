FROM node:24-bookworm-slim AS deps
WORKDIR /app

COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm --prefix frontend ci
RUN npm --prefix backend ci

FROM deps AS build
COPY frontend ./frontend
RUN npm --prefix frontend run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

RUN apt-get update \
  && apt-get install -y --no-install-recommends tzdata ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./backend/
RUN npm --prefix backend ci --omit=dev

COPY backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE ${PORT}
CMD ["npm", "--prefix", "backend", "start"]
