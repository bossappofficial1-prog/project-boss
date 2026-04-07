import { Prisma } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";

export class MemberRepository {
  static async create(data: CreateMemberInput) {
    return db.guestCustomer.create({ data });
  }

  static async findById(id: string, outletId?: string) {

    const outletFilter = outletId
      ? Prisma.sql`AND o."outletId" = ${outletId}`
      : Prisma.empty;

    const membershipOutletFilter = outletId
      ? Prisma.sql`AND mo."outletId" = ${outletId}`
      : Prisma.empty;

    const guestOutletExistsFilter = outletId
      ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Order" ex_o 
            WHERE ex_o."guestCustomerId" = gc.id 
              AND ex_o."outletId" = ${outletId}
          )`
      : Prisma.empty;

    const rawCustomer = await db.$queryRaw<any[]>`
        SELECT 
            gc.*,
            (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', o.id,
                        'totalAmount', o."totalAmount",
                        'orderStatus', o."orderStatus",
                        'paymentStatus', o."paymentStatus",
                        'createdAt', o."createdAt",
                        'outletId', o."outletId"
                    ) ORDER BY o."createdAt" DESC
                ), '[]'::json)
                FROM "Order" o
                WHERE o."guestCustomerId" = gc.id
                  AND o."paymentStatus" = 'SUCCESS'
                  ${outletFilter}
            ) AS orders,
            
            -- Sub-query untuk merelasikan Memberships
            (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'id', m.id,
                        'joinedAt', m."joinedAt",
                        'order', (
                            SELECT row_to_json(ord.*) 
                            FROM "Order" ord 
                            WHERE ord.id = m."orderId"
                        )
                    ) ORDER BY m."joinedAt" DESC
                ), '[]'::json)
                FROM "Membership" m
                JOIN "Order" mo ON mo.id = m."orderId"
                WHERE m."guestCustomerId" = gc.id
                  ${membershipOutletFilter}
            ) AS memberships
            
        FROM "GuestCustomer" gc
        WHERE gc.id = ${id}
          -- KONDISI UTAMA: Jangan ambil / hitung guest yang nomor teleponnya 0000000000
          AND gc.phone != '0000000000'
          ${guestOutletExistsFilter}
        LIMIT 1;
    `;

    if (!rawCustomer || rawCustomer.length === 0) {
      return null;
    }

    return rawCustomer[0];
  }

  static async findByPhone(phone: string) {
    return db.guestCustomer.findUnique({ where: { phone } });
  }

  static async findByOutletId(outletId: string, search?: string, skip = 0, take = 20) {
    const searchParam = search
      ? Prisma.sql`AND (gc.name ILIKE ${'%' + search + '%'} OR gc.phone ILIKE ${'%' + search + '%'})`
      : Prisma.empty;

    // 1. Dapatkan Total Data
    const countResult = await db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT gc.id)::int as count
      FROM "GuestCustomer" gc
      JOIN "Order" o ON o."guestCustomerId" = gc.id
      WHERE o."outletId" = ${outletId}
        AND gc.phone != '0000000000' -- Abaikan pelanggan walk-in
        AND o."paymentStatus" = 'SUCCESS' -- Hanya hitung pesanan sukses
        ${searchParam}
    `;
    const total = countResult[0]?.count || 0;

    if (total === 0) {
      return { members: [], total: 0 };
    }

    // 2. Dapatkan Data dengan Raw SQL + CTE
    const rawMembers = await db.$queryRaw<any[]>`
      -- CTE: Menghitung statistik awal (Tanggal order terakhir & Total Order) per pelanggan
      WITH CustomerStats AS (
          SELECT 
              gc.id as "guestCustomerId",
              MAX(o."createdAt") as "latestOrderDate",
              COUNT(o.id)::int as "orderCount"
          FROM "GuestCustomer" gc
          JOIN "Order" o ON o."guestCustomerId" = gc.id
          WHERE o."outletId" = ${outletId}
            AND gc.phone != '0000000000' -- Abaikan pelanggan walk-in
            AND o."paymentStatus" = 'SUCCESS' -- Hanya hitung pesanan sukses
            ${searchParam}
          GROUP BY gc.id
      )
      SELECT 
          gc.*,
          
          -- Ambil 1 Order Terakhir (yang sukses) sebagai Array JSON persis seperti Prisma "take: 1"
          (
              SELECT COALESCE(json_agg(
                  json_build_object('id', o_latest.id, 'createdAt', o_latest."createdAt")
              ), '[]'::json)
              FROM (
                  SELECT o.id, o."createdAt"
                  FROM "Order" o
                  WHERE o."guestCustomerId" = gc.id
                    AND o."outletId" = ${outletId}
                    AND o."paymentStatus" = 'SUCCESS'
                  ORDER BY o."createdAt" DESC
                  LIMIT 1
              ) o_latest
          ) AS orders,
          
          -- Ambil 1 Membership Terakhir sebagai Array JSON persis seperti Prisma "take: 1"
          (
              SELECT COALESCE(json_agg(
                  json_build_object('id', m_latest.id, 'joinedAt', m_latest."joinedAt")
              ), '[]'::json)
              FROM (
                  SELECT m.id, m."joinedAt"
                  FROM "Membership" m
                  JOIN "Order" mo ON mo.id = m."orderId"
                  WHERE m."guestCustomerId" = gc.id
                    AND mo."outletId" = ${outletId}
                  ORDER BY m."joinedAt" DESC
                  LIMIT 1
              ) m_latest
          ) AS memberships,

          -- Hitung total order (di-passing persis dengan struktur _count: { orders: X } bawaan Prisma)
          json_build_object('orders', cs."orderCount") AS "_count"
          
      FROM CustomerStats cs
      JOIN "GuestCustomer" gc ON gc.id = cs."guestCustomerId"
      ORDER BY cs."latestOrderDate" DESC
      LIMIT ${take} OFFSET ${skip}
    `;

    return { members: rawMembers, total };
  }

  static async update(id: string, data: UpdateMemberInput) {
    return db.guestCustomer.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return db.guestCustomer.delete({ where: { id } });
  }

  static async findMembership(guestCustomerId: string, orderId: string) {
    return db.membership.findUnique({
      where: { guestCustomerId_orderId: { guestCustomerId, orderId } },
    });
  }

  static async increasePoint(guestCustomerId: string, orderId: string, point: number) {
    return db.membership.upsert({
      where: { guestCustomerId_orderId: { guestCustomerId, orderId } },
      update: { point: { increment: point } },
      create: { guestCustomerId, orderId, point },
    });
  }

  static async getTotalPoint(guestCustomerId: string, outletId?: string) {
    const result = await db.membership.aggregate({
      where: {
        guestCustomerId,
        ...(outletId ? { order: { outletId } } : {}),
      },
      _sum: { point: true },
    });
    return result._sum.point ?? 0;
  }
}
