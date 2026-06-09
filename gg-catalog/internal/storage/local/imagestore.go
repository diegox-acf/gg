package local

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/diegox-acf/gg-catalog/internal/catalog"
)

// Store implements catalog.ImageStore using the local filesystem.
// Images are served through the catalog's own HTTP server at /images/{key}.
type Store struct {
	dir     string
	baseURL string
}

var _ catalog.ImageStore = (*Store)(nil)

func New(dir, baseURL string) (*Store, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("local image store: create dir %q: %w", dir, err)
	}
	return &Store{dir: dir, baseURL: baseURL}, nil
}

func (s *Store) Put(_ context.Context, key string, r io.Reader, _ int64, _ string) error {
	dst := filepath.Join(s.dir, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return fmt.Errorf("local store put: mkdir: %w", err)
	}
	f, err := os.Create(dst)
	if err != nil {
		return fmt.Errorf("local store put: create: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return fmt.Errorf("local store put: write: %w", err)
	}
	return nil
}

func (s *Store) Delete(_ context.Context, key string) error {
	dst := filepath.Join(s.dir, filepath.FromSlash(key))
	if err := os.Remove(dst); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("local store delete: %w", err)
	}
	return nil
}

func (s *Store) PublicURL(key string) string {
	return s.baseURL + "/images/" + key
}

// FileHandler returns an http.Handler that serves images from the local directory.
// Mount it at /images in the chi router. StripPrefix removes the mount path so the
// key "case1.webp" maps to <dir>/case1.webp (not <dir>/images/case1.webp).
func (s *Store) FileHandler() http.Handler {
	return http.StripPrefix("/images", http.FileServer(http.Dir(s.dir)))
}
