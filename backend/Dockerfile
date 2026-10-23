FROM node:24-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM golang:1.27-alpine AS api
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/taskflow-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/taskflow-migrate ./cmd/migrate

FROM alpine:3.22
RUN apk add --no-cache ca-certificates && adduser -D -u 10001 taskflow
WORKDIR /app
COPY --from=api /out/taskflow-api /usr/local/bin/taskflow-api
COPY --from=api /out/taskflow-migrate /usr/local/bin/taskflow-migrate
COPY --from=web /app/dist/taskflow/browser ./web
ENV APP_ENV=production \
    HTTP_ADDR=:8080 \
    STATIC_DIR=/app/web \
    COOKIE_SECURE=true
USER taskflow
EXPOSE 8080
ENTRYPOINT ["taskflow-api"]
