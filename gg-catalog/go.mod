module github.com/diegox-acf/gg-catalog

go 1.22

require github.com/diegox-acf/gg-proto v0.0.0

replace github.com/diegox-acf/gg-proto => ../gg-proto

require (
	github.com/caarlos0/env/v11 v11.2.2
	github.com/go-chi/chi/v5 v5.1.0
	github.com/golang-migrate/migrate/v4 v4.18.1
	github.com/jackc/pgx/v5 v5.7.2
	github.com/prometheus/client_golang v1.20.5
	go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc v0.57.0
	go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp v0.57.0
	go.opentelemetry.io/otel v1.32.0
	go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc v1.32.0
	go.opentelemetry.io/otel/metric v1.32.0
	go.opentelemetry.io/otel/sdk v1.32.0
	go.opentelemetry.io/otel/trace v1.32.0
	google.golang.org/grpc v1.68.1
	google.golang.org/protobuf v1.35.2
)
