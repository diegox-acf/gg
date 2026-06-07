# syntax=docker/dockerfile:1

# ── Stage 1: build ─────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

WORKDIR /src

# Cache module downloads as a separate layer
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -ldflags="-s -w" -trimpath -o /bin/catalog ./cmd/catalog

# ── Stage 2: runtime ───────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /bin/catalog /catalog

EXPOSE 8080

ENTRYPOINT ["/catalog"]
