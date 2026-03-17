package service

import (
	"backend_go/query"
	"backend_go/repository"
	"context"

	"golang.org/x/sync/errgroup"
)

type BannerDTO struct {
	ID       string    `json:"id"`
	Title    string    `json:"title"`
	Subtitle string    `json:"subtitle"`
	ImageUrl string    `json:"imageUrl"`
	Cta      BannerCTA `json:"cta"`
}

type BannerCTA struct {
	Type    string `json:"type"`
	Payload string `json:"payload"`
}

type CategoryDTO struct {
	ID          string `json:"id"`
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

var homeCategories = []CategoryDTO{
	{ID: "cat-food", Slug: "food", Title: "Makanan", Description: "Kuliner favorit di sekitarmu", Icon: "food"},
	{ID: "cat-drink", Slug: "drink", Title: "Minuman", Description: "Kopi, teh, dan minuman segar", Icon: "drink"},
	{ID: "cat-shop", Slug: "shop", Title: "Toko", Description: "Belanja kebutuhan harian", Icon: "shop"},
	{ID: "cat-service", Slug: "service", Title: "Jasa", Description: "Salon, bengkel, dan lainnya", Icon: "service"},
}

type DashboardResponse struct {
	VerifiedUMKM        int                            `json:"verifiedUmkm"`
	SuccessTransactions int                            `json:"successTransactions"`
	PopularItems        []repository.PopularItemDTO    `json:"popularItems"`
	Banners             []*BannerDTO                   `json:"banners"`
	Categories          []CategoryDTO                  `json:"categories"`
	Outlets             []repository.TopOutletResponse `json:"outlets"`
}

func GetHomeData(parentCtx context.Context) (*DashboardResponse, error) {
	var umkmCount int
	var trxCount int
	var banners []*BannerDTO
	var popularItems []repository.PopularItemDTO
	var outlets []repository.TopOutletResponse

	ctx, cancel := context.WithCancel(parentCtx)
	defer cancel()

	eg, egCtx := errgroup.WithContext(ctx)
	eg.SetLimit(2)

	eg.Go(func() error {
		var err error
		umkmCount, err = repository.CountVerifiedUmkm()
		return err
	})

	eg.Go(func() error {
		var err error
		outlets, err = repository.FindTopOutlets("")
		return err
	})

	eg.Go(func() error {
		var err error
		trxCount, err = repository.CountSuccessfulTransactions()
		return err
	})

	eg.Go(func() error {
		var err error
		popularItems, err = repository.FindPopularItems(8)
		return err
	})

	eg.Go(func() error {
		var err error
		rawBanners, err := query.Banner.
			WithContext(egCtx).
			Where(query.Banner.IsActive.Is(true)).
			Order(query.Banner.SortOrder.Asc()).
			Limit(100).
			Find()

		if err != nil {
			return err
		}

		banners = make([]*BannerDTO, len(rawBanners))
		for i, b := range rawBanners {
			banners[i] = &BannerDTO{
				ID:       b.ID,
				Title:    b.Title,
				Subtitle: b.Subtitle,
				ImageUrl: b.ImageURL,
				Cta: BannerCTA{
					Type:    b.CtaType,
					Payload: b.CtaPayload,
				},
			}
		}
		return err
	})

	if err := eg.Wait(); err != nil {
		return nil, err
	}

	return &DashboardResponse{
		VerifiedUMKM:        umkmCount,
		SuccessTransactions: trxCount,
		PopularItems:        popularItems,
		Banners:             banners,
		Categories:          homeCategories,
		Outlets:             outlets,
	}, nil
}
