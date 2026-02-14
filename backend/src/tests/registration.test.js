import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import supabase from '../config/supabase.js';

vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('Registration API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register a student successfully', async () => {
    const studentData = {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      whatsapp: '08123456789',
      grade: '10 SMA',
      program: 'Matematika',
      city: 'Palembang'
    };

    // Mock RPC success
    supabase.rpc.mockResolvedValueOnce({
      data: {
        status: 'success',
        data: {
          id: 'student-id-123',
          user_id: 'user-id-123'
        }
      },
      error: null
    });

    const res = await request(app)
      .post('/api/auth/register/student')
      .send(studentData);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('student@test.com');
    expect(res.body.user.role).toBe('student');
  });

  it('should return 409 if email is already registered', async () => {
    const studentData = {
      name: 'Test Student',
      email: 'duplicate@test.com',
      password: 'password123',
      whatsapp: '08123456789'
    };

    // Mock RPC error (email exists)
    supabase.rpc.mockResolvedValueOnce({
      data: {
        status: 'error',
        message: 'Email sudah terdaftar'
      },
      error: null
    });

    const res = await request(app)
      .post('/api/auth/register/student')
      .send(studentData);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Email sudah terdaftar');
  });

  it('should return 400 for missing required fields', async () => {
    const incompleteData = {
      name: 'Test Student',
      // email missing
      password: 'password123',
      whatsapp: '08123456789'
    };

    const res = await request(app)
      .post('/api/auth/register/student')
      .send(incompleteData);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Missing required fields');
  });

  it('should handle "user_id" column missing error with helpful message', async () => {
    const studentData = {
      name: 'Test Student',
      email: 'db-error@test.com',
      password: 'password123',
      whatsapp: '08123456789'
    };

    // Mock RPC error (column missing)
    supabase.rpc.mockResolvedValueOnce({
      data: {
        status: 'error',
        message: 'column "user_id" of relation "students" does not exist',
        code: '42703'
      },
      error: null
    });

    const res = await request(app)
      .post('/api/auth/register/student')
      .send(studentData);

    expect(res.status).toBe(500);
    expect(res.body.message).toContain('Sinkronisasi database diperlukan');
  });
});
