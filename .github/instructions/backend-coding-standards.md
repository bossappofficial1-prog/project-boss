---
applyTo: "backend/**"
---

# Backend Coding Standards

## Arsitektur Wajib

Semua kode backend HARUS mengikuti pola **class-based** dengan inheritance dari base class.

```
routes → Controller (class) → Service (class) → Repository (class)
```

## ❌ JANGAN (Anti-Pattern)

```typescript
// SALAH: function-based service
export async function getAllUserService() {
  return await UserRepository.findAll();
}

// SALAH: controller tanpa class
export const getUserController = asyncHandler(async (req, res) => {
  const data = await getUserService();
  return ResponseUtil.success(res, data);
});

// SALAH: service langsung akses Prisma
export class UserService {
  static async getAll() {
    return db.user.findMany(); // ❌ Langsung akses db
  }
}
```

## ✅ BENAR (Pattern yang Harus Diikuti)

### 1. Base Controller

```typescript
// src/controller/base.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";

export abstract class BaseController {
  protected handler(fn: (req: Request, res: Response) => Promise<any>) {
    return asyncHandler(fn);
  }

  protected success(
    res: Response,
    data: any,
    statusCode = 200,
    message?: string,
  ) {
    return ResponseUtil.success(res, data, statusCode, message);
  }

  protected paginated(
    res: Response,
    data: any[],
    page: number,
    limit: number,
    total: number,
    extra?: any,
  ) {
    return ResponseUtil.paginated(res, data, page, limit, total, extra);
  }

  protected error(
    res: Response,
    message: string,
    errors?: any[],
    statusCode = 500,
  ) {
    return ResponseUtil.error(res, message, errors, statusCode);
  }
}
```

### 2. Controller Implementation

```typescript
// src/controller/supplier.controller.ts
import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { SupplierService } from "../service/supplier.service";

class SupplierController extends BaseController {
  getAll = this.handler(async (req: Request, res: Response) => {
    const query = req.query;
    const result = await SupplierService.getAll(query);
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
    const result = await SupplierService.getById(id);
    return this.success(res, result);
  });

  create = this.handler(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await SupplierService.create(data);
    return this.success(res, result, 201);
  });

  update = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;
    const result = await SupplierService.update(id, data);
    return this.success(res, result);
  });

  delete = this.handler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await SupplierService.delete(id);
    return this.success(res, null);
  });
}

export const supplierController = new SupplierController();
```

### 3. Base Service (Abstract)

```typescript
// src/service/base.service.ts
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";

export abstract class BaseService {
  protected static notFound(message = "Data tidak ditemukan"): never {
    throw new AppError(message, HttpStatus.NOT_FOUND);
  }

  protected static badRequest(message: string): never {
    throw new AppError(message, HttpStatus.BAD_REQUEST);
  }

  protected static conflict(message: string): never {
    throw new AppError(message, HttpStatus.CONFLICT);
  }

  protected static forbidden(message: string): never {
    throw new AppError(message, HttpStatus.FORBIDDEN);
  }
}
```

### 4. Service Implementation

```typescript
// src/service/supplier.service.ts
import { BaseService } from "./base.service";
import { SupplierRepository } from "../repositories/supplier.repository";
import {
  CreateSupplierInput,
  UpdateSupplierInput,
} from "../schemas/supplier.schema";

export class SupplierService extends BaseService {
  static async getAll(query: any) {
    return SupplierRepository.findAll(query);
  }

  static async getById(id: string) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) this.notFound("Supplier tidak ditemukan");
    return supplier;
  }

  static async create(data: CreateSupplierInput) {
    return SupplierRepository.create(data);
  }

  static async update(id: string, data: UpdateSupplierInput) {
    await this.getById(id); // Ensure exists
    return SupplierRepository.update(id, data);
  }

  static async delete(id: string) {
    await this.getById(id); // Ensure exists
    return SupplierRepository.delete(id);
  }
}
```

### 5. Repository (tetap sama)

```typescript
// src/repositories/supplier.repository.ts
import { db } from "../config/prisma";

export class SupplierRepository {
  static async findById(id: string) {
    return db.supplier.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  static async findAll(query: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }] }
      : undefined;

    const [data, total] = await db.$transaction([
      db.supplier.findMany({ where, skip, take: limit }),
      db.supplier.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(data: any) {
    return db.supplier.create({ data });
  }

  static async update(id: string, data: any) {
    return db.supplier.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return db.supplier.delete({ where: { id } });
  }
}
```

### 6. Route Registration

```typescript
// src/routes/supplier.route.ts
import { Router } from "express";
import { supplierController } from "../controller/supplier.controller";
import { validateSchema } from "../middleware/zod.middleware";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../schemas/supplier.schema";
import { protect, authorize } from "../middleware/auth.middleware";

const supplierRouter = Router();

supplierRouter.use(protect);

supplierRouter.get("/", supplierController.getAll);
supplierRouter.get("/:id", supplierController.getById);
supplierRouter.post(
  "/",
  validateSchema(createSupplierSchema),
  supplierController.create,
);
supplierRouter.patch(
  "/:id",
  validateSchema(updateSupplierSchema),
  supplierController.update,
);
supplierRouter.delete("/:id", supplierController.delete);

export default supplierRouter;
```

## Aturan Ketat

1. **Service TIDAK BOLEH langsung akses `db` (Prisma)** — semua query lewat Repository
2. **Controller TIDAK BOLEH punya business logic** — hanya extract request data dan panggil service
3. **Repository TIDAK BOLEH throw error** — return null/empty, biarkan service yang handle
4. **Validasi input pakai Zod** di middleware, bukan di controller/service
5. **Semua class pakai `static` methods** kecuali butuh instance state
6. **Penamaan file:** `nama-fitur.service.ts`, `nama-fitur.controller.ts`, `nama-fitur.repository.ts`
7. **Response selalu pakai `ResponseUtil`** — jangan manual `res.json()`
8. **Error handling pakai `AppError`** — jangan throw Error biasa

## Checklist Sebelum Menulis Kode Backend

- [ ] Sudah ada Repository class untuk entity ini?
- [ ] Service extends BaseService?
- [ ] Controller extends BaseController?
- [ ] Schema Zod sudah dibuat di `schemas/`?
- [ ] Route sudah didaftarkan di `index.route.ts`?
- [ ] Tidak ada akses `db` langsung di service?
- [ ] Response pakai ResponseUtil?
