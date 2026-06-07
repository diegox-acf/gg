package catalog

import (
	"context"
	"io"
)

// ImageStore is the port for image storage. Adapters (local, S3) implement this interface.
// The local adapter stores files on the filesystem and serves them via the catalog's HTTP server.
// The S3 adapter stores files in S3 and serves them via public S3/CDN URLs.
type ImageStore interface {
	Put(ctx context.Context, key string, r io.Reader, size int64, contentType string) error
	Delete(ctx context.Context, key string) error
	PublicURL(key string) string
}
