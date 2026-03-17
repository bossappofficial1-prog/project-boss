package main

import (
	"backend_go/config"

	"gorm.io/gen"
)

func main() {
	config.ConnectDatabase()

	// inisialisasi Generator
	g := gen.NewGenerator(gen.Config{
		OutPath:      "./query",
		ModelPkgPath: "./model",
		Mode:         gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
	})

	db := config.DB
	if db == nil {
		panic("koneksi database belum terinisialisasi")
	}
	g.UseDB(db)

	tables, err := db.Migrator().GetTables()
	if err != nil {
		panic("Gagal mengambil list tabel: " + err.Error())
	}
	var models []interface{}
	for _, table := range tables {
		// Abaikan tabel internal migrasi Prisma (jika ada)
		// karena menyebabkan error struct unexported di Go
		if table == "_prisma_migrations" {
			continue
		}

		// Hindari bentrok nama variabel dengan method bawaan gorm gen (Transaction())
		// Kita ubah nama model struct-nya menjadi TransactionRecord
		if table == "Transaction" {
			models = append(models, g.GenerateModelAs(table, "TransactionRecord"))
			continue
		}

		// Generate tabel sisanya secara normal
		models = append(models, g.GenerateModel(table))
	}

	g.ApplyBasic(models...)

	g.Execute()
}
