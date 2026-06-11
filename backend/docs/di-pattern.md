# Dependency Injection (DI) Pattern dengan Awilix

## Overview

Backend ini menggunakan **Awilix** sebagai DI container untuk mengelola dependency antar module. Pattern ini memungkinkan:
- **Loose coupling** antar module
- **Easy testing** dengan mock dependency
- **Clear dependency graph** yang terlihat di container

> ⚠️ **PENTING:** Nama parameter di constructor HARUS SAMA dengan nama registrasi di container. Awilix menggunakan nama parameter untuk resolve dependency.

---

## Arsitektur

```
Route → Controller → Service → Repository → Prisma
         ↑              ↑           ↑
         └──────────────┴───────────┘
              DI Container (Awilix)
```

---

## Standar Penulisan

### 1. Repository

Repository WAJIB extends `BaseRepository` dan menggunakan instance methods.

```typescript
// src/repositories/user.repository.ts
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository {
  // Method harus instance (bukan static)
  async findById(id: string) {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserInput) {
    return this.db.user.create({ data });
  }
}
```

**Rules:**
- TIDAK BOLEH import `db` langsung
- Gunakan `this.db` yang di-inject dari constructor
- Semua method harus `async` atau mengembalikan `Promise`
- TIDAK BOLEH menggunakan `static` methods

---

### 2. Service

Service WAJIB extends `BaseService` dan menerima dependencies melalui constructor.

```typescript
// src/service/auth.service.ts
import { BaseService } from "./base.service";
import { UserRepository } from "../repositories/user.repository";
import { StaffRepository } from "../repositories/staff.repository";

export class AuthService extends BaseService {
  // Dependencies di-inject melalui constructor
  // Nama parameter HARUS SAMA dengan nama registrasi di container
  constructor(
    private userRepository: UserRepository,
    private staffRepository: StaffRepository,
  ) {
    super();
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.notFound("User tidak ditemukan"); // Gunakan helper dari BaseService
    }
    // ... logic lainnya
  }
}
```

**Rules:**
- Dependencies di-inject melalui constructor
- **Nama parameter HARUS SAMA dengan nama registrasi di container** (e.g., `userRepository` bukan `userRepo`)
- Gunakan `private` modifier untuk menyimpan dependencies
- Gunakan helper methods dari `BaseService` (`this.notFound()`, `this.badRequest()`, dll)
- TIDAK BOLEH import repository langsung (kecuali untuk type/interface)
- TIDAK BOLEH menggunakan `static` methods

---

### 3. Controller

Controller WAJIB extends `BaseController` dan menerima service melalui constructor.

```typescript
// src/controller/auth.controller.ts
import { BaseController } from "./base.controller";
import { AuthService } from "../service/auth.service";
import { Request, Response } from "express";

export class AuthController extends BaseController {
  // Service di-inject melalui constructor
  constructor(private authService: AuthService) {
    super();
  }

  // Handler methods menggunakan arrow function
  login = this.handler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    return this.success(res, result);
  });

  getMe = this.handler(async (req: Request, res: Response) => {
    const user = await this.authService.getMe(req.storedUser!.id);
    return this.success(res, user);
  });
}
```

**Rules:**
- Service di-inject melalui constructor
- **Nama parameter HARUS SAMA dengan nama registrasi di container** (e.g., `authService` bukan `authSvc`)
- Gunakan `this.handler()` untuk wrap async handler
- Gunakan `this.success()`, `this.paginated()`, `this.error()` untuk response
- Handler methods harus arrow function untuk binding context

---

### 4. Container Registration

Semua dependency di-register di `src/container.ts`.

```typescript
// src/container.ts
import { createContainer, asClass, asValue } from "awilix";
import { db } from "./config/prisma";
import { UserRepository } from "./repositories/user.repository";
import { AuthService } from "./service/auth.service";
import { AuthController } from "./controller/auth.controller";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure — singleton
  db: asValue(db),

  // Repositories — scoped (per request)
  userRepository: asClass(UserRepository).scoped(),
  staffRepository: asClass(StaffRepository).scoped(),

  // Services — scoped (per request)
  authService: asClass(AuthService).scoped(),

  // Controllers — scoped (per request)
  authController: asClass(AuthController).scoped(),
});

export { container };
```

**Lifetime Options:**
- `SINGLETON` → satu instance untuk semua request (untuk infra seperti db, redis)
- `SCOPED` → satu instance per request (untuk service, repository, controller)
- `TRANSIENT` → baru setiap kali resolve (jarang dipakai)

---

### 5. Container Types

Definisikan tipe untuk container di `src/types/container.types.ts`.

```typescript
// src/types/container.types.ts
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../service/auth.service";
import { AuthController } from "../controller/auth.controller";

export interface Cradle {
  // Infrastructure
  db: PrismaClient;

  // Repositories
  userRepository: UserRepository;
  staffRepository: StaffRepository;

  // Services
  authService: AuthService;

  // Controllers
  authController: AuthController;
}
```

**Naming Convention:**
- Repository → `camelCase` + suffix `Repository` (e.g., `userRepository`)
- Service → `camelCase` + suffix `Service` (e.g., `authService`)
- Controller → `camelCase` + suffix `Controller` (e.g., `authController`)
- Infrastructure → `camelCase` biasa (e.g., `db`, `redis`)

---

### 6. Route Setup

Route resolve controller dari container.

```typescript
// src/routes/auth.route.ts
import { Router } from "express";
import { container } from "../container";

const authRouter = Router();

// Resolve controller dari container
const authController = container.resolve("authController");

// Gunakan controller methods langsung
authRouter.post("/login", authController.login);
authRouter.get("/me", protect, authController.getMe);

export default authRouter;
```

---

## Cara Refactor Module Lama

### Step 1: Refactor Repository

```typescript
// BEFORE (static methods)
export class UserRepository {
  static async findById(id: string) {
    return db.user.findUnique({ where: { id } });
  }
}

// AFTER (instance methods dengan DI)
export class UserRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
}
```

### Step 2: Refactor Service

```typescript
// BEFORE (static methods)
export class AuthService extends BaseService {
  static async login(data: LoginInput) {
    const user = await UserRepository.findByEmail(data.email);
    if (!user) this.unauthorized("Invalid");
    // ...
  }
}

// AFTER (instance methods dengan DI)
export class AuthService extends BaseService {
  constructor(private userRepo: UserRepository) {
    super();
  }

  async login(data: LoginInput) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) this.unauthorized("Invalid");
    // ...
  }
}
```

### Step 3: Refactor Controller

```typescript
// BEFORE (static service call)
export class AuthController extends BaseController {
  login = this.handler(async (req, res) => {
    const result = await AuthService.login(req.body);
    return this.success(res, result);
  });
}

// AFTER (DI)
export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  login = this.handler(async (req, res) => {
    const result = await this.authService.login(req.body);
    return this.success(res, result);
  });
}
```

### Step 4: Register di Container

```typescript
// src/container.ts
container.register({
  userRepository: asClass(UserRepository).scoped(),
  authService: asClass(AuthService).scoped(),
  authController: asClass(AuthController).scoped(),
});
```

### Step 5: Update Route

```typescript
// BEFORE
import { authController } from "../controller/auth.controller";
authRouter.post("/login", authController.login);

// AFTER
import { container } from "../container";
const authController = container.resolve("authController");
authRouter.post("/login", authController.login);
```

---

## Testing dengan DI

Pattern DI memudahkan testing karena bisa mock dependencies:

```typescript
// auth.service.test.ts
import { AuthService } from "./auth.service";

// Mock repositories
const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockStaffRepo = {
  findByUsername: jest.fn(),
};

// Inject mocks
const authService = new AuthService(mockUserRepo, mockStaffRepo);

describe("AuthService", () => {
  it("should throw error if user not found", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "test@test.com", password: "123" })
    ).rejects.toThrow("User tidak ditemukan");
  });
});
```

---

## Checklist Refactor

Untuk setiap module yang di-refactor:

- [ ] Repository extends `BaseRepository`
- [ ] Repository menggunakan `this.db` (bukan import `db`)
- [ ] Service extends `BaseService`
- [ ] Service menerima dependencies via constructor
- [ ] Controller extends `BaseController`
- [ ] Controller menerima service via constructor
- [ ] Register di `container.ts`
- [ ] Tambah type di `container.types.ts`
- [ ] Update route untuk resolve dari container
- [ ] Pastikan tidak ada error TypeScript (`bun run typecheck`)
