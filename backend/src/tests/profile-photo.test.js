import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { JWT_SECRET } from '../config/env.js';

vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}));

describe('Profile Photo Upload API Tests', () => {
  const tutorToken = jwt.sign({ id: 'tutor-123', role: 'tutor' }, JWT_SECRET);
  const studentToken = jwt.sign({ id: 'student-123', role: 'student' }, JWT_SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure upload directory exists for tests
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  it('should upload tutor profile photo successfully', async () => {
    supabase.single.mockResolvedValueOnce({ data: { id: 'tutor-id' }, error: null });

    const res = await request(app)
      .post('/api/users/profile/photo')
      .set('Authorization', `Bearer ${tutorToken}`)
      .attach('photo', Buffer.from('fake-image-data'), 'test.png');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.url).toContain('/uploads/photo-');
    expect(supabase.from).toHaveBeenCalledWith('tutors');
    expect(supabase.update).toHaveBeenCalledWith({ profile_photo: expect.any(String) });
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'tutor-123');
  });

  it('should upload student profile photo successfully', async () => {
    supabase.single.mockResolvedValueOnce({ data: { id: 'student-id' }, error: null });

    const res = await request(app)
      .post('/api/users/profile/photo')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('photo', Buffer.from('fake-image-data'), 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(supabase.from).toHaveBeenCalledWith('students');
    expect(supabase.eq).toHaveBeenCalledWith('user_id', 'student-123');
  });

  it('should return 400 if no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/users/profile/photo')
      .set('Authorization', `Bearer ${tutorToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tidak ada file yang diunggah');
  });

  it('should return 401 if unauthorized', async () => {
    const res = await request(app)
      .post('/api/users/profile/photo')
      .attach('photo', Buffer.from('fake-image-data'), 'test.png');

    expect(res.status).toBe(401);
  });
});
