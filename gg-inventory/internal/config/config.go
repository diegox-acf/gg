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

	// Kafka outbox relay (Milestone C). Comma-separated brokers; poll interval and batch
	// size for the outbox poller.
	KafkaBrokers         []string `env:"KAFKA_BROKERS"          envDefault:"localhost:9092"`
	OutboxPollIntervalMs int      `env:"OUTBOX_POLL_INTERVAL_MS" envDefault:"1000"`
	OutboxBatchSize      int      `env:"OUTBOX_BATCH_SIZE"       envDefault:"100"`

	// Kafka consumer (Milestone D) — commit/release reservations off terminal order events.
	KafkaConsumerGroup string `env:"KAFKA_CONSUMER_GROUP" envDefault:"gg-inventory"`
	OrdersTopic        string `env:"ORDERS_TOPIC"         envDefault:"orders.order-created"`

	// Reservation sweeper (Milestone D3) — expire RESERVED rows past their TTL. Interval is
	// well under ReservationTTLMinutes so expiries are caught promptly once a reservation ages out.
	SweepIntervalMs int `env:"SWEEP_INTERVAL_MS" envDefault:"30000"`
	SweepBatchSize  int `env:"SWEEP_BATCH_SIZE"  envDefault:"100"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
