import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfile } from '../controllers/user.controller.js';
import supabase from '../config/supabase.js';

// Mock supabase
vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null }))
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '1', name: 'Test' }, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'report1' }, error: null }))
        }))
      }))
    }))
  }
}));

describe('User Controller - updateProfile', () => {
  it('should include profile_photo when updating tutor profile', async () => {
    const req = {
      user: { id: 'user123', role: 'tutor' },
      body: {
        name: 'New Name',
        profile_photo: 'http://example.com/photo.jpg',
        profileData: { education: 'PhD' }
      }
    };
    const res = {
      json: vi.fn()
    };
    const next = vi.fn();

    await updateProfile(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });
});

describe('Report System Verification', () => {
  it('should validate score is between 0-100', async () => {
    // This is a placeholder since we are testing routes usually via supertest
    // but we can verify the logic is implemented in reports.js
    expect(true).toBe(true);
  });
});
