.PHONY: catalog-build catalog-test \
        orders-build orders-test \
        inventory-build inventory-test \
        storefront-dev storefront-build \
        seed-images \
        up down infra-up infra-down

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
	mkdir -p gg-catalog/data/images gg-local/volumes/images
	cp gg-product-images/* gg-catalog/data/images/
	cp gg-product-images/* gg-local/volumes/images/

# --- Infra ---

infra-up:
	cd gg-local && docker compose up -d

infra-down:
	cd gg-local && docker compose down -v

# --- Whole project ---
# Build + start the entire stack, then apply the catalog/inventory migrations.
# Orders auto-migrates (Flyway). Compose waits for the postgres healthchecks
# (depends_on: service_healthy) before this returns, so the DBs are ready to
# migrate. Both migrate steps are idempotent, so `make up` is safe to re-run.

up:
	cd gg-local && docker compose up -d --build
	$(MAKE) -C gg-catalog migrate-up
	$(MAKE) -C gg-inventory migrate-up
	$(MAKE) seed-images
	@echo ""
	@echo "Stack is up:"
	@echo "  Storefront      http://localhost:3000   (demo / demo12345)"
	@echo "  Admin console   http://localhost:3002   (admin / admin12345)"
	@echo "  Keycloak admin  http://localhost:8081   (admin / admin)"
	@echo "  Kafka UI        http://localhost:8090"
	@echo "  Adminer (PG)    http://localhost:8091"
	@echo "  Redis Commander http://localhost:8092"

# Stop the whole stack, keeping data volumes (use `make infra-down` for a full
# reset that wipes volumes — after which `make up` re-applies migrations).
down:
	cd gg-local && docker compose down
