package s3

import (
	"context"
	"fmt"
	"io"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
)

// Store implements catalog.ImageStore backed by Amazon S3.
// Images are served via public S3 or CDN URLs — no HTTP serving through the catalog.
//
// TODO: configure with github.com/aws/aws-sdk-go-v2/service/s3.
// TODO: wire bucket/region from config and build the s3.Client in main.go.
type Store struct {
	bucket  string
	region  string
	cdnBase string // optional CDN prefix; if empty, falls back to S3 URL
	// client *s3.Client
}

var _ catalog.ImageStore = (*Store)(nil)

func New(bucket, region, cdnBase string) *Store {
	return &Store{bucket: bucket, region: region, cdnBase: cdnBase}
}

func (s *Store) Put(_ context.Context, key string, _ io.Reader, _ int64, _ string) error {
	// TODO: s3.PutObject with Body, ContentLength, ContentType
	return fmt.Errorf("s3 image store: not implemented")
}

func (s *Store) Delete(_ context.Context, key string) error {
	// TODO: s3.DeleteObject
	return fmt.Errorf("s3 image store: not implemented")
}

func (s *Store) PublicURL(key string) string {
	if s.cdnBase != "" {
		return s.cdnBase + "/" + key
	}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", s.bucket, s.region, key)
}
