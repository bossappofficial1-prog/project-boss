import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
    it('should return 401 for invalid login', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'wrong@mail.com', password: 'salah' });
        expect(res.statusCode).toBe(400);
    });
});
