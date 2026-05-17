---
inclusion: fileMatch
fileMatchPattern: "backend/**"
---

# Backend Coding Standards (Kiro Steering)

## Arsitektur Wajib: Class-Based

Semua kode backend HARUS mengikuti pola class-based:

- **Controller** → extends `BaseController` dari `backend/src/controller/base.controller.ts`
- **Service** → extends `BaseService` dari `backend/src/service/base.service.ts`
- **Repository** → class dengan static methods (satu-satunya yang boleh akses Prisma `db`)

## Aturan Ketat

1. Service TIDAK BOLEH langsung akses `db` (Prisma) — semua lewat Repository
2. Controller TIDAK BOLEH punya business logic — hanya extract request + panggil service
3. Repository TIDAK BOLEH throw error — return null/empty, service yang handle
4. Validasi input pakai Zod schema di middleware
5. Response selalu pakai `ResponseUtil`
6. Error handling pakai `AppError` (throw dari service via `this.notFound()`, `this.badRequest()`, dll)

## Pattern Controller

```typescript
import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { XxxService } from "../service/xxx.service";

class XxxController extends BaseController {
  getAll = this.handler(async (req: Request, res: Response) => {
    const result = await XxxService.getAll(req.query);
    return this.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
    );
  });

  getById = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await XxxService.getById(id);
    return this.success(res, result);
  });

  create = this.handler(async (req: Request, res: Response) => {
    const result = await XxxService.create(req.body);
    return this.success(res, result, 201);
  });

  update = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await XxxService.update(id, req.body);
    return this.success(res, result);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await XxxService.delete(id);
    return this.success(res, null);
  });
}

export const xxxController = new XxxController();
```

## Pattern Service

```typescript
import { BaseService } from "./base.service";
import { XxxRepository } from "../repositories/xxx.repository";

export class XxxService extends BaseService {
  static async getAll(query: any) {
    return XxxRepository.findAll(query);
  }

  static async getById(id: string) {
    const data = await XxxRepository.findById(id);
    if (!data) this.notFound("Xxx tidak ditemukan");
    return data;
  }

  static async create(input: any) {
    return XxxRepository.create(input);
  }

  static async update(id: string, input: any) {
    await this.getById(id);
    return XxxRepository.update(id, input);
  }

  static async delete(id: string) {
    await this.getById(id);
    return XxxRepository.delete(id);
  }
}
```

## Pattern Repository

```typescript
import { db } from "../config/prisma";

export class XxxRepository {
  static async findById(id: string) {
    return db.xxx.findUnique({ where: { id } });
  }

  static async findAll(query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;
    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : undefined;

    const [data, total] = await db.$transaction([
      db.xxx.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.xxx.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(data: any) {
    return db.xxx.create({ data });
  }

  static async update(id: string, data: any) {
    return db.xxx.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return db.xxx.delete({ where: { id } });
  }
}
```

## Referensi File

- Base Controller: `backend/src/controller/base.controller.ts`
- Base Service: `backend/src/service/base.service.ts`
- AppError: `backend/src/errors/app-error.ts`
- ResponseUtil: `backend/src/utils/response.ts`
- Error Middleware: `backend/src/middleware/error.middleware.ts`
