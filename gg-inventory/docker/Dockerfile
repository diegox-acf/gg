# syntax=docker/dockerfile:1

# ── Stage 1: build ─────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /src

# Cache module downloads as a separate layer
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 \
    go build -ldflags="-s -w" -trimpath -o /bin/inventory ./cmd/inventory

# ── Stage 2: runtime ───────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /bin/inventory /inventory

EXPOSE 8082

ENTRYPOINT ["/inventory"]
