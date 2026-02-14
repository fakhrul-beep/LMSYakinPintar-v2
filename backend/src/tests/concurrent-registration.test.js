import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import supabase from '../config/supabase.js';

vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn()
  }
}));

describe('Concurrent Registration', () => {
  it('should handle concurrent registrations for the same email correctly', async () => {
    const userData = {
      name: 'Test User',
      email: 'concurrent@example.com',
      password: 'Password123!',
      whatsapp: '08123456789',
      grade: '12',
      program: 'IPA',
      city: 'Jakarta'
    };

    const mockMaybeSingle = vi.fn();
    const mockInsert = vi.fn();
    const mockSelect = vi.fn();
    const mockSingle = vi.fn();

    // Mock flow:
    // 1. Check if user exists (maybeSingle)
    // 2. Insert user (insert)
    // 3. Select user (select)
    // 4. Single result (single)

    supabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: mockMaybeSingle,
          insert: mockInsert,
        };
      }
      if (table === 'students') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'student-1' }, error: null })
        };
      }
      return {};
    });

    // First request: check passes (no user), insert succeeds
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ 
        data: { id: 'user-1', email: 'concurrent@example.com', role: 'student', name: 'Test User' }, 
        error: null 
      })
    });

    // Second request: check passes (simulating race condition where first hasn't finished), but insert fails with 23505
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({ 
        data: null, 
        error: { code: '23505', message: 'duplicate key value violates unique constraint' } 
      })
    });

    // Execute both requests "concurrently"
    const [res1, res2] = await Promise.all([
      request(app).post('/api/auth/register/student').send(userData),
      request(app).post('/api/auth/register/student').send(userData)
    ]);

    // First one should succeed
    expect(res1.statusCode).toBe(201);
    expect(res1.body.status).toBe('success');

    // Second one should fail with 409
    expect(res2.statusCode).toBe(409);
    expect(res2.body.message).toBe('Email already registered');
  });
});
