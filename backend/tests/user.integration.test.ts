import request from "supertest";
import { db } from "../src/config/prisma";
import app from "../src/app";

describe("User Routes", () => {
  // Bersihkan tabel sebelum & sesudah test
  beforeEach(async () => {
    await db.user.deleteMany();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  const testUser = {
    name: "Pitok",
    email: "pitok@example.com",
    password: "secure123"
  };

  let createdUserId: string;

  it("should create a new user", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    createdUserId = res.body.data.id;
  });

  it("should fail to create a user with duplicate email", async () => {
    await db.user.create({ data: testUser });

    const res = await request(app)
      .post("/api/v1/users")
      .send(testUser)
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/email sudah/i);
  });

  it("should get all users", async () => {
    await db.user.create({ data: testUser });

    const res = await request(app).get("/api/v1/users").expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should get user by ID", async () => {
    const user = await db.user.create({ data: testUser });

    const res = await request(app).get(`/api/v1/users/${user.id}`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(user.id);
  });

  it("should update user", async () => {
    const user = await db.user.create({ data: testUser });

    const res = await request(app)
      .patch(`/api/v1/users/${user.id}`)
      .send({ name: "Updated Name" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("should delete user", async () => {
    const user = await db.user.create({ data: testUser });

    const res = await request(app)
      .delete(`/api/v1/users/${user.id}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const deleted = await db.user.findUnique({ where: { id: user.id } });
    expect(deleted).toBeNull();
  });

  it("should return 404 for unknown user", async () => {
    const fakeId = "b8a1c9f2-b2c3-4e4d-8b16-018e71fc3e70"; // UUID format

    const res = await request(app)
      .get(`/api/v1/users/${fakeId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
