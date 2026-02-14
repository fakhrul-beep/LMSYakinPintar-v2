import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import supabase from '../src/config/supabase.js';

describe('Sistem Autentikasi Admin', () => {
  const adminCredentials = {
    email: 'admin@yakinpintar.com',
    password: '@OurProject123'
  };

  it('Harus menolak login dengan password salah', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: adminCredentials.email,
        password: 'PasswordSalah123!'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toContain('Kredensial tidak valid');
  });

  it('Harus berhasil login dengan kredensial admin yang benar', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send(adminCredentials);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(adminCredentials.email);
  });

  it('Harus menolak pembuatan admin dengan password lemah', async () => {
    // Memerlukan token login dari tes sebelumnya
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send(adminCredentials);
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New Admin',
        email: 'newadmin@yakinpintar.com',
        password: 'weak',
        role: 'admin'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Validasi input gagal');
  });
});
