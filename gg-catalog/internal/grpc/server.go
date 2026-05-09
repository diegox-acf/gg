package grpc

import (
	"context"
	"encoding/json"

	catalogv1 "github.com/diegox-acf/gg-proto/gen/catalog/v1"
	"github.com/diegox-acf/gg-catalog/internal/catalog"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CatalogServer struct {
	catalogv1.UnimplementedCatalogServiceServer
	svc *catalog.Service
}

func NewCatalogServer(svc *catalog.Service) *CatalogServer {
	return &CatalogServer{svc: svc}
}

func (s *CatalogServer) ListProducts(ctx context.Context, req *catalogv1.ListProductsRequest) (*catalogv1.ListProductsResponse, error) {
	products, nextToken, err := s.svc.ListProducts(ctx, catalog.ListProductsFilter{
		CategoryID: req.CategoryId,
		PageSize:   req.PageSize,
		PageToken:  req.PageToken,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list products: %v", err)
	}

	resp := &catalogv1.ListProductsResponse{NextPageToken: nextToken}
	for _, p := range products {
		resp.Products = append(resp.Products, domainToProto(p))
	}
	return resp, nil
}

func (s *CatalogServer) GetProduct(ctx context.Context, req *catalogv1.GetProductRequest) (*catalogv1.GetProductResponse, error) {
	p, err := s.svc.GetProduct(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get product: %v", err)
	}
	if p == nil {
		return nil, status.Errorf(codes.NotFound, "product %d not found", req.Id)
	}
	return &catalogv1.GetProductResponse{Product: domainToProto(p)}, nil
}

func (s *CatalogServer) GetProductsByIds(ctx context.Context, req *catalogv1.GetProductsByIdsRequest) (*catalogv1.GetProductsByIdsResponse, error) {
	products, err := s.svc.GetProductsByIDs(ctx, req.Ids)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get products by ids: %v", err)
	}

	resp := &catalogv1.GetProductsByIdsResponse{}
	for _, p := range products {
		resp.Products = append(resp.Products, domainToProto(p))
	}
	return resp, nil
}

func (s *CatalogServer) ListCategories(ctx context.Context, _ *catalogv1.ListCategoriesRequest) (*catalogv1.ListCategoriesResponse, error) {
	categories, err := s.svc.ListCategories(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list categories: %v", err)
	}

	resp := &catalogv1.ListCategoriesResponse{}
	for _, c := range categories {
		resp.Categories = append(resp.Categories, &catalogv1.Category{
			Id:    c.ID,
			Slug:  c.Slug,
			Label: c.Label,
			Icon:  c.Icon,
		})
	}
	return resp, nil
}

func domainToProto(p *catalog.Product) *catalogv1.Product {
	specsJSON, _ := json.Marshal(p.Specs)
	return &catalogv1.Product{
		Id:          p.ID,
		Sku:         p.SKU,
		Slug:        p.Slug,
		Name:        p.Name,
		Brand:       p.Brand,
		Description: p.Description,
		CategoryId:  p.CategoryID,
		PriceCents:  p.PriceCents,
		Currency:    p.Currency,
		SpecsJson:   string(specsJSON),
		StockStatus: string(p.StockStatus),
	}
}
