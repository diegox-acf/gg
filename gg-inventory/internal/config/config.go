package config

import "github.com/caarlos0/env/v11"

type Config struct {
	HTTPPort       int    `env:"HTTP_PORT"                   envDefault:"8082"`
	DatabaseURL    string `env:"DATABASE_URL"                required:"true"`
	OTELEndpoint   string `env:"OTEL_EXPORTER_OTLP_ENDPOINT" envDefault:"localhost:4318"`
	ServiceName    string `env:"OTEL_SERVICE_NAME"           envDefault:"gg-inventory"`
	ServiceVersion string `env:"OTEL_SERVICE_VERSION"        envDefault:"dev"`
	Environment    string `env:"DEPLOYMENT_ENVIRONMENT"      envDefault:"dev"`
	LogLevel       string `env:"LOG_LEVEL"                   envDefault:"info"`

	// ReservationTTL is how long a RESERVED reservation is held before the sweeper
	// (added in a later milestone) may expire it. 15 minutes per the data model.
	ReservationTTLMinutes int `env:"RESERVATION_TTL_MINUTES" envDefault:"15"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
