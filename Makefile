.PHONY: catalog-build catalog-test \
        orders-build orders-test \
        inventory-build inventory-test \
        storefront-dev storefront-build \
        infra-up infra-down

# --- Catalog (Go) ---

catalog-build:
	cd gg-catalog && go build ./...

catalog-test:
	cd gg-catalog && go test ./...

# --- Orders (Java) ---

orders-build:
	cd gg-orders && ./gradlew build -x test

orders-test:
	cd gg-orders && ./gradlew test

# --- Inventory (Go) ---

inventory-build:
	cd gg-inventory && go build ./...

inventory-test:
	cd gg-inventory && go test ./...

# --- Storefront (Next.js) ---

storefront-dev:
	cd gg-storefront && pnpm dev

storefront-build:
	cd gg-storefront && pnpm build

# --- Infra ---

infra-up:
	docker compose up -d

infra-down:
	docker compose down -v
