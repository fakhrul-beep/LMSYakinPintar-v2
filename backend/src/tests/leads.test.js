import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";

// Mock Supabase
vi.mock("../config/supabase.js", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockOr = vi.fn().mockReturnThis();
  
  const queryBuilder = {
    from: vi.fn().mockReturnThis(),
    insert: mockInsert,
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit,
    or: mockOr,
    rpc: vi.fn()
  };

  return {
    default: queryBuilder
  };
});

// Helper to get access to mocks
import supabase from "../config/supabase.js";

describe("Registration Leads API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/leads/student", () => {
    it("should create a student lead with valid data", async () => {
      // Mock successful lead creation
      supabase.single.mockResolvedValueOnce({
        data: { id: "lead-123", type: "student", payload: { whatsapp: "081234567890", studentName: "Jane Doe" } },
        error: null
      });

      // Mock sync success (fetch lead in syncLeadToStudent)
      supabase.single.mockResolvedValueOnce({
        data: { 
          id: "lead-123", 
          type: "student", 
          payload: { 
            whatsapp: "081234567890",
            parentName: "John Doe",
            studentName: "Jane Doe",
            grade: "SD",
            program: "Matematika",
            city: "Palembang"
          } 
        },
        error: null
      });

      // Mock RPC call for atomic student creation
      supabase.rpc.mockResolvedValueOnce({
        data: { 
          status: "success", 
          data: { id: "student-123", user_id: "user-123" } 
        },
        error: null
      });

      const res = await request(app)
        .post("/api/leads/student")
        .send({
          parentName: "John Doe",
          whatsapp: "081234567890",
          studentName: "Jane Doe",
          grade: "SD",
          program: "Matematika",
          city: "Palembang",
          area: "Ilir Barat",
          schedulePreference: "Senin 16:00"
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.lead).toHaveProperty("id");
      expect(res.body.data.syncSuccess).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith("create_student_v1", expect.any(Object));
    });

    it("should return 400 for invalid data (missing field)", async () => {
      const res = await request(app)
        .post("/api/leads/student")
        .send({
          parentName: "John Doe"
          // Missing other fields
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("fail");
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 for invalid whatsapp format", async () => {
      const res = await request(app)
        .post("/api/leads/student")
        .send({
          parentName: "John Doe",
          whatsapp: "abc1234567", // Not digits
          studentName: "Jane Doe",
          grade: "SD",
          program: "Matematika",
          city: "Palembang",
          area: "Ilir Barat"
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });

  describe("POST /api/leads/tutor", () => {
    it("should create a tutor lead with valid data", async () => {
      // Mock successful tutor lead creation
      supabase.single.mockResolvedValueOnce({
        data: { id: "lead-tutor-123", type: "tutor", payload: {} },
        error: null
      });

      const res = await request(app)
        .post("/api/leads/tutor")
        .send({
          fullName: "Tutor Name",
          whatsapp: "089876543210",
          email: "tutor@example.com",
          education: "UNSRI",
          experience: "2 tahun",
          subjects: "Fisika, Kimia",
          studentGrades: ["SMA"],
          hourlyRate: "50000",
          city: "Palembang",
          area: "Sako",
          availability: "Sore hari"
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.lead).toHaveProperty("id");
    });

    it("should return 400 for invalid email", async () => {
      const res = await request(app)
        .post("/api/leads/tutor")
        .send({
          fullName: "Tutor Name",
          whatsapp: "089876543210",
          email: "invalid-email",
          education: "UNSRI",
          experience: "2 tahun",
          subjects: "Fisika",
          studentGrades: ["SMA"],
          hourlyRate: "50000",
          city: "Palembang",
          area: "Sako",
          availability: "Sore hari"
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("fail");
    });
  });
});
