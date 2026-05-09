.PHONY: proto lint breaking

proto:
	buf generate --template buf.gen.go-catalog.yaml --path catalog/
	buf generate --template buf.gen.go-inventory.yaml --path inventory/
	buf generate --template buf.gen.ts.yaml

lint:
	buf lint

breaking:
	buf breaking --against '.git#branch=main'
