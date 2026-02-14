import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import supabase from '../config/supabase.js';
import bcrypt from 'bcryptjs';

vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}));

describe('Login API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should login successfully with correct credentials', async () => {
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);
    const email = 'TEST@example.com';

    // Mock finding the user
    supabase.single.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        password_hash: passwordHash
      },
      error: null
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should fail with incorrect password', async () => {
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);
    const email = 'test@example.com';

    supabase.single.mockResolvedValueOnce({
      data: {
        id: 'user-123',
        name: 'Test User',
        email,
        role: 'student',
        password_hash: passwordHash
      },
      error: null
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('should fail if user not found', async () => {
    supabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' }
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('should fail if email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email dan password harus diisi');
  });
});
