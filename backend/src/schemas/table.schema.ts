import { z } from "zod";

export const createTableZoneSchema = z.object({
    name: z.string().min(1, "Nama zona wajib diisi"),
    outletId: z.string().min(1, "ID Outlet wajib diisi"),
});

export const updateTableZoneSchema = z.object({
    name: z.string().min(1).optional(),
});

export const createTableSchema = z.object({
    number: z.string().min(1, "Nomor/Nama meja wajib diisi"),
    capacity: z.number().int().min(1, "Kapasitas minimal 1 person"),
    zoneId: z.string().uuid("ID Zona tidak valid"),
});

export const updateTableSchema = z.object({
    number: z.string().min(1).optional(),
    capacity: z.number().int().min(1).optional(),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).optional(),
    zoneId: z.string().uuid().optional(),
});

export const getPublicTableContextSchema = z.object({
    params: z.object({
        tableId: z.string().uuid("ID meja tidak valid"),
    }),
    query: z.object({
        outletSlug: z.string().min(1, "Slug outlet wajib diisi"),
    }),
});

export type CreateTableZoneInput = z.infer<typeof createTableZoneSchema>;
export type UpdateTableZoneInput = z.infer<typeof updateTableZoneSchema>;
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type GetPublicTableContextInput = z.infer<typeof getPublicTableContextSchema>;
