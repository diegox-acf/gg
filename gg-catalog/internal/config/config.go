package config

import "github.com/caarlos0/env/v11"

type Config struct {
	HTTPPort       int    `env:"HTTP_PORT"                   envDefault:"8080"`
	DatabaseURL    string `env:"DATABASE_URL"                required:"true"`
	OTELEndpoint   string `env:"OTEL_EXPORTER_OTLP_ENDPOINT" envDefault:"localhost:4318"`
	ServiceName    string `env:"OTEL_SERVICE_NAME"           envDefault:"gg-catalog"`
	ServiceVersion string `env:"OTEL_SERVICE_VERSION"        envDefault:"dev"`
	Environment    string `env:"DEPLOYMENT_ENVIRONMENT"      envDefault:"dev"`
	LogLevel       string `env:"LOG_LEVEL"                   envDefault:"info"`

	// OIDC — Keycloak realm issuer for optional JWT validation (see ADR-017).
	// Empty disables auth (the catalog runs fully public). When set, a Bearer
	// token, if present, must be valid; absent tokens still serve public reads.
	OIDCIssuer string `env:"OIDC_ISSUER" envDefault:""`

	// Image storage
	// IMAGE_STORE_TYPE: "local" (default) or "s3"
	ImageStoreType string `env:"IMAGE_STORE_TYPE" envDefault:"local"`
	// IMAGE_STORE_PATH: root directory for the local image store
	ImageStorePath string `env:"IMAGE_STORE_PATH" envDefault:"./data/images"`
	// IMAGE_BASE_URL: base URL prepended to image keys when building public URLs
	ImageBaseURL string `env:"IMAGE_BASE_URL" envDefault:"http://localhost:8080"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
