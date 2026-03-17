package repository

import (
	"backend_go/config"
	"strings"
)

type PopularItemDTO struct {
	ID        string  `json:"id" gorm:"columnLid"`
	Name      string  `json:"name" gorm:"column:name"`
	Image     *string `json:"image" gorm:"column:image"` // Pointer karena bisa null
	Type      string  `json:"type" gorm:"column:type"`
	Slug      string  `json:"slug" gorm:"column:slug"`
	Price     float64 `json:"price" gorm:"column:price"`
	SoldCount int     `json:"soldCount" gorm:"column:sold_count"`
}

type rawTopOutletDTO struct {
	ID           string  `json:"id" gorm:"column:id"`
	Name         string  `json:"name" gorm:"column:name"`
	Description  string  `json:"description" gorm:"column:description"`
	Address      string  `json:"address" gorm:"column:address"`
	Phone        string  `json:"phone" gorm:"column:phone"`
	Image        string  `json:"image" gorm:"column:image"`
	Latitude     float64 `json:"latitude" gorm:"column:latitude"`
	Longitude    float64 `json:"longitude" gorm:"column:longitude"`
	IsOpen       bool    `json:"isOpen" gorm:"column:isOpen"`
	Slug         string  `json:"slug" gorm:"column:slug"`
	BusinessName string  `json:"-" gorm:"column:business_name"`
	Orders       int     `json:"-" gorm:"column:orders"`
}

type OutletBusinessDTO struct {
	Name string `json:"name"`
}

type OutletCountDTO struct {
	Orders int `json:"orders"`
}

type TopOutletResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Address     string            `json:"address"`
	Phone       string            `json:"phone"`
	Image       string            `json:"image"`
	Latitude    float64           `json:"latitude"`
	Longitude   float64           `json:"longitude"`
	IsOpen      bool              `json:"isOpen"`
	Slug        string            `json:"slug"`
	Business    OutletBusinessDTO `json:"business"`
	Count       OutletCountDTO    `json:"_count"`
}

func CountVerifiedUmkm() (int, error) {
	var count int
	query := `SELECT CAST(COUNT(*) AS INTEGER) as count FROM "User" WHERE role = 'OWNER' AND "isVerified" = true;`
	err := config.DB.Raw(query).Scan(&count).Error
	return count, err
}

func CountSuccessfulTransactions() (int, error) {
	var count int
	query := `SELECT CAST(COUNT(*) AS INTEGER) as count FROM "Transaction" WHERE status = 'SUCCESS';`
	err := config.DB.Raw(query).Scan(&count).Error
	return count, err
}

func FindPopularItems(limit int) ([]PopularItemDTO, error) {
	var items []PopularItemDTO

	query := `
		SELECT
			p.id, p.name, p.image, p.type, out.slug,
			COALESCE(pg."sellingPrice", ps."sellingPrice", 0) AS price,
			CAST(SUM(oi.quantity) AS INTEGER) AS sold_count
		FROM "Product" p
		INNER JOIN "Outlet" out ON out.id = p."outletId"
		LEFT JOIN "ProductGoods" pg ON pg."productId" = p.id
		LEFT JOIN "ProductService" ps ON ps."productId" = p.id
		INNER JOIN "OrderItem" oi ON oi."productId" = p.id
		INNER JOIN "Order" o ON o.id = oi."orderId"
		INNER JOIN "Transaction" t ON t."orderId" = o.id
		WHERE t.status = 'SUCCESS'
		GROUP BY p.id, p.name, p.image, p.type, out.slug, pg."sellingPrice", ps."sellingPrice"
		ORDER BY sold_count DESC
		LIMIT ?;
	`

	err := config.DB.Raw(query, limit).Scan(&items).Error
	return items, err
}

// FindTopOutlets mencari outlet teratas dengan relasi JSON
func FindTopOutlets(searchQuery string) ([]TopOutletResponse, error) {
	var rawOutlets []rawTopOutletDTO
	var query string
	var err error

	// Base logic sama seperti di Node.js, kita pisahkan jika ada search atau tidak
	if strings.TrimSpace(searchQuery) != "" {
		searchParam := "%" + searchQuery + "%"
		query = `
			SELECT 
				o.id,
				o.name,
				o.description,
				o.address,
				o.phone,
				o.image,
				o.latitude,
				o.longitude,
				o."isOpen",
				o.slug,
				b.name as business_name,
				COALESCE(order_counts.successful_orders, 0) as orders
			FROM "Outlet" o
			JOIN "Business" b ON o."businessId" = b.id
			LEFT JOIN (
				SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
				FROM "Order" ord
				JOIN "Transaction" tr ON tr."orderId" = ord.id
				WHERE tr.status = 'SUCCESS'
				GROUP BY ord."outletId"
			) order_counts ON order_counts."outletId" = o.id
			WHERE o.name ILIKE ? OR b.name ILIKE ?
			ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
			LIMIT 6;
		`
		// Pass parameter dua kali untuk masing-masing tanda '?'
		err = config.DB.Raw(query, searchParam, searchParam).Scan(&rawOutlets).Error
	} else {
		query = `
			SELECT 
				o.id,
				o.name,
				o.description,
				o.address,
				o.phone,
				o.image,
				o.latitude,
				o.longitude,
				o."isOpen",
				o.slug,
				b.name as business_name,
				COALESCE(order_counts.successful_orders, 0) as orders
			FROM "Outlet" o
			JOIN "Business" b ON o."businessId" = b.id
			LEFT JOIN (
				SELECT ord."outletId", COUNT(ord.id)::int as successful_orders
				FROM "Order" ord
				JOIN "Transaction" tr ON tr."orderId" = ord.id
				WHERE tr.status = 'SUCCESS'
				GROUP BY ord."outletId"
			) order_counts ON order_counts."outletId" = o.id
			ORDER BY COALESCE(order_counts.successful_orders, 0) DESC
			LIMIT 6;
		`
		err = config.DB.Raw(query).Scan(&rawOutlets).Error
	}

	if err != nil {
		return nil, err
	}

	responses := make([]TopOutletResponse, 0, len(rawOutlets))
	for _, raw := range rawOutlets {
		responses = append(responses, TopOutletResponse{
			ID:          raw.ID,
			Name:        raw.Name,
			Description: raw.Description,
			Address:     raw.Address,
			Phone:       raw.Phone,
			Image:       raw.Image,
			Latitude:    raw.Latitude,
			Longitude:   raw.Longitude,
			IsOpen:      raw.IsOpen,
			Slug:        raw.Slug,
			Business: OutletBusinessDTO{
				Name: raw.BusinessName,
			},
			Count: OutletCountDTO{
				Orders: raw.Orders,
			},
		})
	}

	return responses, nil
}
