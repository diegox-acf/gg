package config

import "github.com/caarlos0/env/v11"

type Config struct {
	GRPCPort     int    `env:"GRPC_PORT"                     envDefault:"9090"`
	HTTPPort     int    `env:"HTTP_PORT"                     envDefault:"8080"`
	DatabaseURL  string `env:"DATABASE_URL"                  required:"true"`
	OTELEndpoint string `env:"OTEL_EXPORTER_OTLP_ENDPOINT"   envDefault:"localhost:4317"`
	ServiceName  string `env:"OTEL_SERVICE_NAME"             envDefault:"gg-catalog"`
	ServiceVersion string `env:"OTEL_SERVICE_VERSION"         envDefault:"dev"`
	Environment  string `env:"DEPLOYMENT_ENVIRONMENT"        envDefault:"dev"`
	LogLevel     string `env:"LOG_LEVEL"                     envDefault:"info"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
