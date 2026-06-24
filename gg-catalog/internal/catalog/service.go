package catalog

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path"
	"strings"
)

// ErrInvalidProduct flags a product create/update rejected by validation (→ HTTP 400).
var ErrInvalidProduct = errors.New("invalid product")

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

// CreateProduct validates and inserts a new product (admin).
func (s *Service) CreateProduct(ctx context.Context, in ProductWrite) (*Product, error) {
	norm, err := validateProductWrite(in)
	if err != nil {
		return nil, err
	}
	return s.repo.CreateProduct(ctx, norm)
}

// UpdateProduct validates and replaces a product's mutable fields (admin). Returns
// pgx.ErrNoRows (via the repo) when the id does not exist.
func (s *Service) UpdateProduct(ctx context.Context, id int64, in ProductWrite) (*Product, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: invalid product id", ErrInvalidProduct)
	}
	norm, err := validateProductWrite(in)
	if err != nil {
		return nil, err
	}
	return s.repo.UpdateProduct(ctx, id, norm)
}

// DeleteProduct removes a product (admin). Returns pgx.ErrNoRows when not found.
func (s *Service) DeleteProduct(ctx context.Context, id int64) error {
	if id <= 0 {
		return fmt.Errorf("%w: invalid product id", ErrInvalidProduct)
	}
	return s.repo.DeleteProduct(ctx, id)
}

// validateProductWrite trims, defaults, and checks a product write. Required: sku,
// slug, name, brand, category_id. Defaults: currency USD, specs {}, stock in-stock.
func validateProductWrite(in ProductWrite) (ProductWrite, error) {
	in.SKU = strings.TrimSpace(in.SKU)
	in.Slug = strings.TrimSpace(in.Slug)
	in.Name = strings.TrimSpace(in.Name)
	in.Brand = strings.TrimSpace(in.Brand)
	in.CategoryID = strings.TrimSpace(in.CategoryID)
	in.Currency = strings.TrimSpace(in.Currency)

	if in.SKU == "" || in.Slug == "" || in.Name == "" || in.Brand == "" || in.CategoryID == "" {
		return in, fmt.Errorf("%w: sku, slug, name, brand and category_id are required", ErrInvalidProduct)
	}
	if in.PriceCents < 0 {
		return in, fmt.Errorf("%w: price_cents must be >= 0", ErrInvalidProduct)
	}
	if in.Currency == "" {
		in.Currency = "USD"
	}
	if len(in.Specs) == 0 {
		in.Specs = json.RawMessage("{}")
	} else if !json.Valid(in.Specs) {
		return in, fmt.Errorf("%w: specs must be valid JSON", ErrInvalidProduct)
	}
	switch in.StockStatus {
	case "":
		in.StockStatus = StockStatusInStock
	case StockStatusInStock, StockStatusLowStock, StockStatusOutOfStock:
		// ok
	default:
		return in, fmt.Errorf("%w: invalid stock_status", ErrInvalidProduct)
	}
	return in, nil
}

func randomHex() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
