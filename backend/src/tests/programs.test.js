import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Program Management Integration Tests", () => {
  let adminToken;
  const adminEmail = process.env.TEST_ADMIN_EMAIL || "admin@yakinpintar.com";
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || "password123";

  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post("/api/admin/login")
      .send({ email: adminEmail, password: adminPassword });
    
    if (res.status === 200) {
      adminToken = res.body.token;
    }
  });

  describe("CRUD /api/admin/programs", () => {
    let testProgramId;
    const testProgram = {
      name: `Test Program ${Date.now()}`,
      description: "This is a test program description",
      price: 150000,
      category: "Test",
      isActive: true,
      duration: "1 Month"
    };

    it("POST /api/admin/programs - should create a new program", async () => {
      if (!adminToken) return;
      
      const slug = testProgram.name.toLowerCase().replace(/ /g, "-");
      const res = await request(app)
        .post("/api/admin/programs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...testProgram, slug });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.name).toBe(testProgram.name);
      testProgramId = res.body.data.id;
    });

    it("POST /api/admin/programs - should fail with duplicate name", async () => {
      if (!adminToken) return;

      const slug = "duplicate-slug-" + Date.now();
      const res = await request(app)
        .post("/api/admin/programs")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...testProgram, slug });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("sudah ada");
    });

    it("GET /api/admin/programs - should list programs", async () => {
      if (!adminToken) return;

      const res = await request(app)
        .get("/api/admin/programs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data.programs)).toBe(true);
      expect(res.body.data.programs.some(p => p.id === testProgramId)).toBe(true);
    });

    it("PUT /api/admin/programs/:id - should update program", async () => {
      if (!adminToken || !testProgramId) return;

      const updatedName = `Updated ${testProgram.name}`;
      const res = await request(app)
        .put(`/api/admin/programs/${testProgramId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: updatedName });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(updatedName);
    });

    it("DELETE /api/admin/programs/:id - should delete program", async () => {
      if (!adminToken || !testProgramId) return;

      const res = await request(app)
        .delete(`/api/admin/programs/${testProgramId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
