.PHONY: catalog-build catalog-test \
        orders-build orders-test \
        inventory-build inventory-test \
        storefront-dev storefront-build \
        seed-images \
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

# --- Mock product images ---
# Copy the committed mock images into the catalog's local image store so it can
# serve them at /images/<key>. The seed migration references these filenames.
# (For the containerized catalog, copy into the gg-local/volumes/images mount.)

seed-images:
	mkdir -p gg-catalog/data/images
	cp gg-product-images/* gg-catalog/data/images/
	if [ -f gg-catalog/data/images/powersuplly2.webp ]; then \
		mv -f gg-catalog/data/images/powersuplly2.webp gg-catalog/data/images/powersupply2.webp; \
	fi

# --- Infra ---

infra-up:
	docker compose up -d

infra-down:
	docker compose down -v
