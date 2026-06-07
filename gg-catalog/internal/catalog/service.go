package catalog

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"path"
)

type Service struct {
	repo   Repository
	images ImageStore
}

func NewService(repo Repository, images ImageStore) *Service {
	return &Service{repo: repo, images: images}
}

func (s *Service) ListProducts(ctx context.Context, filter ListProductsFilter) ([]*Product, string, error) {
	if filter.PageSize <= 0 {
		filter.PageSize = 20
	}
	products, next, err := s.repo.ListProducts(ctx, filter)
	if err != nil {
		return nil, "", err
	}
	s.resolveImageURLs(products)
	return products, next, nil
}

func (s *Service) GetProduct(ctx context.Context, id int64) (*Product, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid product id: %d", id)
	}
	p, err := s.repo.GetProduct(ctx, id)
	if err != nil {
		return nil, err
	}
	s.resolveImageURLs([]*Product{p})
	return p, nil
}

func (s *Service) GetProductBySlug(ctx context.Context, slug string) (*Product, error) {
	if slug == "" {
		return nil, fmt.Errorf("slug is required")
	}
	p, err := s.repo.GetProductBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	s.resolveImageURLs([]*Product{p})
	return p, nil
}

func (s *Service) GetProductsByIDs(ctx context.Context, ids []int64) ([]*Product, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	products, err := s.repo.GetProductsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	s.resolveImageURLs(products)
	return products, nil
}

// resolveImageURLs rewrites each product's raw primary-image key (set by the
// repository) into a public URL via the image store. Products with no image keep
// an empty ImageURL.
func (s *Service) resolveImageURLs(products []*Product) {
	for _, p := range products {
		if p != nil && p.ImageURL != "" {
			p.ImageURL = s.images.PublicURL(p.ImageURL)
		}
	}
}

func (s *Service) ListCategories(ctx context.Context) ([]*Category, error) {
	return s.repo.ListCategories(ctx)
}

func (s *Service) UploadImage(ctx context.Context, productID int64, filename string, r io.Reader, size int64, contentType string) (*ProductImage, error) {
	if productID <= 0 {
		return nil, fmt.Errorf("invalid product id: %d", productID)
	}
	if _, err := s.repo.GetProduct(ctx, productID); err != nil {
		return nil, fmt.Errorf("product not found: %w", err)
	}

	ext := path.Ext(filename)
	key := fmt.Sprintf("%d/%s%s", productID, randomHex(), ext)

	if err := s.images.Put(ctx, key, r, size, contentType); err != nil {
		return nil, fmt.Errorf("store image: %w", err)
	}

	img, err := s.repo.SaveImage(ctx, &ProductImage{ProductID: productID, Key: key})
	if err != nil {
		_ = s.images.Delete(ctx, key) // best-effort rollback
		return nil, fmt.Errorf("save image metadata: %w", err)
	}

	img.URL = s.images.PublicURL(img.Key)
	return img, nil
}

func (s *Service) ListImages(ctx context.Context, productID int64) ([]*ProductImage, error) {
	if productID <= 0 {
		return nil, fmt.Errorf("invalid product id: %d", productID)
	}
	imgs, err := s.repo.ListImages(ctx, productID)
	if err != nil {
		return nil, err
	}
	for _, img := range imgs {
		img.URL = s.images.PublicURL(img.Key)
	}
	return imgs, nil
}

func (s *Service) DeleteImage(ctx context.Context, id int64) error {
	if id <= 0 {
		return fmt.Errorf("invalid image id: %d", id)
	}
	key, err := s.repo.DeleteImage(ctx, id)
	if err != nil {
		return fmt.Errorf("delete image: %w", err)
	}
	_ = s.images.Delete(ctx, key) // best-effort; metadata is authoritative
	return nil
}

func randomHex() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
