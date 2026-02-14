import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

vi.mock('../middleware/auth.middleware.js', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = { id: 'admin-1', role: 'admin', name: 'Admin' };
    next();
  }),
  requireRole: vi.fn(() => (req, res, next) => next())
}));

vi.mock('../config/supabase.js', () => ({
  default: {
    rpc: vi.fn()
  }
}));

describe('Tutor Creation Sync', () => {
  const adminToken = 'valid-admin-token';
  
  const tutorData = {
    name: 'Tutor Test',
    email: 'tutor@example.com',
    phone: '08123456789',
    specialization: 'Matematika',
    education: 'S1 Matematika UI',
    isActive: true,
    password: 'Password123!',
    role: 'tutor',
    whatsapp: '08123456789'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create both user and tutor records successfully via RPC', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { 
        status: 'success', 
        data: { id: 'tutor-1', user_id: 'user-tutor-1' } 
      },
      error: null
    });

    const res = await request(app)
      .post('/api/admin/tutors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(tutorData);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe('tutor-1');
  }, 10000);

  it('should handle PGRST204 schema cache error with retry for RPC', async () => {
    // First call fails with PGRST204, second succeeds
    supabase.rpc
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST204', message: 'Schema cache mismatch' } })
      .mockResolvedValueOnce({ 
        data: { status: 'success', data: { id: 'tutor-2', user_id: 'user-tutor-2' } }, 
        error: null 
      });

    const res = await request(app)
      .post('/api/admin/tutors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...tutorData, email: 'tutor2@example.com' });

    expect(res.statusCode).toBe(201);
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
  }, 10000);

  it('should return 503 if PGRST204 persists after retries for RPC', async () => {
    supabase.rpc.mockResolvedValue({ 
      data: null, 
      error: { code: 'PGRST204', message: 'Schema cache mismatch' } 
    });

    const res = await request(app)
      .post('/api/admin/tutors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...tutorData, email: 'tutor3@example.com' });

    expect(res.statusCode).toBe(503);
    expect(res.body.message).toContain('Sinkronisasi skema database sedang berlangsung');
  }, 15000);

  it('should handle validation errors from RPC', async () => {
    supabase.rpc.mockResolvedValueOnce({
      data: { status: 'error', message: 'Guru sudah terdaftar' },
      error: null
    });

    const res = await request(app)
      .post('/api/admin/tutors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(tutorData);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Guru sudah terdaftar');
  }, 10000);
});
