import request from "supertest";
import { db } from "../src/config/prisma";
import { redis } from "../src/config/redis";
import app from "../src/app";

describe("Auth Routes - Reset Password", () => {
    // Bersihkan data sebelum & sesudah test
    beforeEach(async () => {
        await db.user.deleteMany();
        // Clear all reset tokens from Redis
        const keys = await redis.keys('reset:*');
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    });

    afterAll(async () => {
        await db.$disconnect();
        await redis.quit();
    });

    const testUser = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "081234567890"
    };

    let resetToken: string;

    it("should create user and request password reset", async () => {
        // Create and verify user first
        const registerRes = await request(app)
            .post("/api/v1/auth/register")
            .send(testUser)
            .expect(201);

        const userId = registerRes.body.data.id;

        // Verify user
        const verificationCode = "123456"; // This would normally come from email
        await db.user.update({
            where: { id: userId },
            data: { isVerified: true }
        });

        // Request password reset
        const forgotRes = await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: testUser.email })
            .expect(200);

        expect(forgotRes.body.success).toBe(true);

        // Get the reset token from Redis (in real scenario, this comes from email)
        const keys = await redis.keys('reset:*');
        expect(keys.length).toBe(1);
        resetToken = keys[0].replace('reset:', '');
    });

    it("should reset password successfully with valid token", async () => {
        // First ensure we have a token
        if (!resetToken) {
            await createTestUserAndToken();
        }

        const newPassword = "NewPass123";

        const resetRes = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({
                token: resetToken,
                password: newPassword
            })
            .expect(200);

        expect(resetRes.body.success).toBe(true);
        expect(resetRes.body.message).toBe("Password berhasil direset");
    });

    it("should prevent token reuse - token should be invalid after first use", async () => {
        // First ensure we have a token
        if (!resetToken) {
            await createTestUserAndToken();
        }

        // First reset attempt - should succeed
        const firstResetRes = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({
                token: resetToken,
                password: "NewPass123"
            })
            .expect(200);

        expect(firstResetRes.body.success).toBe(true);

        // Second reset attempt with same token - should fail
        const secondResetRes = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({
                token: resetToken,
                password: "AnotherPass123"
            })
            .expect(400);

        expect(secondResetRes.body.success).toBe(false);
        expect(secondResetRes.body.message).toBe("Token tidak valid atau sudah expired");
    });

    it("should fail with invalid token", async () => {
        const resetRes = await request(app)
            .post("/api/v1/auth/reset-password")
            .send({
                token: "invalid-token-123",
                password: "ValidPass123"
            })
            .expect(400);

        expect(resetRes.body.success).toBe(false);
        expect(resetRes.body.message).toBe("Token tidak valid atau sudah expired");
    });

    async function createTestUserAndToken() {
        // Create and verify user
        const registerRes = await request(app)
            .post("/api/v1/auth/register")
            .send(testUser)
            .expect(201);

        const userId = registerRes.body.data.id;

        // Verify user
        await db.user.update({
            where: { id: userId },
            data: { isVerified: true }
        });

        // Request password reset
        await request(app)
            .post("/api/v1/auth/forgot-password")
            .send({ email: testUser.email })
            .expect(200);

        // Get the reset token
        const keys = await redis.keys('reset:*');
        resetToken = keys[0].replace('reset:', '');
    }
});