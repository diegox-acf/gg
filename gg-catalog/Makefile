.PHONY: build run test lint migrate-up migrate-down docker-build

BIN      := catalog
CMD      := ./cmd/catalog
IMAGE    := gg-catalog
DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/gg_catalog?sslmode=disable

build:
	go build -o bin/$(BIN) $(CMD)

run:
	air -c .air.toml

test:
	go test ./...

lint:
	golangci-lint run

migrate-up:
	migrate -path ./migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path ./migrations -database "$(DATABASE_URL)" down 1

docker-build:
	docker buildx build \
		--platform linux/arm64 \
		--file docker/Dockerfile \
		--tag $(IMAGE):local \
		.
