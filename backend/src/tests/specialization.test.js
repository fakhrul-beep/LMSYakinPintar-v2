import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as specializationController from '../controllers/specialization.controller.js';
import supabase from '../config/supabase.js';

// Mock Supabase
vi.mock('../config/supabase.js', () => {
  const mockFrom = vi.fn();
  return {
    default: {
      from: mockFrom
    }
  };
});

describe('Specialization Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { params: {}, body: {}, query: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
    
    // Default mock behavior for supabase.from
    supabase.from.mockImplementation((table) => {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      };
    });
  });

  describe('getSpecializationsBySubject', () => {
    it('1. should return 400 if mataPelajaranId is missing', async () => {
      const myReq = { params: { mataPelajaranId: '' } };
      const myRes = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
      let capturedError = null;
      const myNext = (err) => { capturedError = err; };
      
      await specializationController.getSpecializationsBySubject(myReq, myRes, myNext);
      
      expect(capturedError).not.toBeNull();
      expect(capturedError.statusCode).toBe(400);
    });

    it('2. should return 404 if subject not found', async () => {
      mockReq.params = { mataPelajaranId: 'invalid-id' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle
      });
      
      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('3. should return specializations from DB on success', async () => {
      const subjectId = 'subject-123';
      const mockSpecs = [
        { spesialisasi: { id: 'spec-1', name: 'Spec 1' } },
        { spesialisasi: { id: 'spec-2', name: 'Spec 2' } }
      ];
      mockReq.params = { mataPelajaranId: subjectId };
      
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: subjectId, name: 'Math' }, error: null });
      const mockEqRelation = vi.fn().mockResolvedValue({ data: mockSpecs, error: null });

      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: mockEqRelation };
        return {};
      });

      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success', source: 'db' }));
    });

    it('4. should return 404 if DB fails on subject check', async () => {
      mockReq.params = { mataPelajaranId: 'subj-1' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: mockSingle
      });
      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });

    it('5. should return 500 if DB fails on relations fetch', async () => {
      mockReq.params = { mataPelajaranId: 'subj-1' };
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'subj-1' }, error: null });
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: { message: 'Fetch Error' } });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: mockEq };
        return {};
      });

      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
    });

    it('6. should return cached data if available', async () => {
      mockReq.params = { mataPelajaranId: 'cached-id' };
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'cached-id' }, error: null });
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: mockEq };
        return {};
      });

      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      const mockRes2 = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
      await specializationController.getSpecializationsBySubject(mockReq, mockRes2, mockNext);
      
      expect(mockRes2.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'cache' }));
    });
  });

  describe('getAllSubjects', () => {
    it('7. should return all subjects ordered by name', async () => {
      const mockSubjects = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSubjects, error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), order: mockOrder });

      await specializationController.getAllSubjects(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 'success', data: mockSubjects });
    });

    it('8. should return 500 if fetching subjects fails', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), order: mockOrder });
      await specializationController.getAllSubjects(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
    });

    it('9. should return empty array if no subjects exist', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), order: mockOrder });
      await specializationController.getAllSubjects(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ status: 'success', data: [] });
    });
  });

  describe('validateCorrelation', () => {
    it('10. should return 400 if missing parameters', async () => {
      mockReq.body = { mataPelajaranId: '123' };
      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
    });

    it('11. should return valid true if correlation exists', async () => {
      mockReq.body = { mataPelajaranId: 'subj-1', spesialisasiId: 'spec-1' };
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'rel-1' }, error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle });

      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ valid: true }));
    });

    it('12. should return valid false and log error if correlation does not exist', async () => {
      mockReq.body = { mataPelajaranId: 'subj-1', spesialisasiId: 'spec-2', userId: 'user-1' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'correlation_errors') return { insert: mockInsert };
        return {};
      });

      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
      expect(mockInsert).toHaveBeenCalled();
    });

    it('13. should return 500 if DB error during validation', async () => {
      mockReq.body = { mataPelajaranId: 'subj-1', spesialisasiId: 'spec-1' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Fatal', code: 'PGRST500' } });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle });
      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
    });

    it('14. should still return valid: false even if logging fails', async () => {
      mockReq.body = { mataPelajaranId: 'subj-1', spesialisasiId: 'spec-2' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: { message: 'Log fail' } });
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'correlation_errors') return { insert: mockInsert };
        return {};
      });
      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ valid: false }));
    });

    it('15. should handle missing userId in logging (use null)', async () => {
      mockReq.body = { mataPelajaranId: 'subj-1', spesialisasiId: 'spec-2' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found', code: 'PGRST116' } });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'correlation_errors') return { insert: mockInsert };
        return {};
      });
      await specializationController.validateCorrelation(mockReq, mockRes, mockNext);
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: null }));
    });
  });

  describe('Integration & Edge Cases', () => {
    it('16. should filter out specializations with null data', async () => {
      mockReq.params = { mataPelajaranId: 'subj-1' };
      const mockData = [{ spesialisasi: { id: 's1', name: 'S1' } }, { spesialisasi: null }];
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'subj-1' }, error: null });
      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: mockEq };
        return {};
      });
      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockRes.json.mock.calls[0][0].data).toHaveLength(1);
    });

    it('17. should return empty array if no correlations exist', async () => {
      mockReq.params = { mataPelajaranId: 'subj-empty' };
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'subj-empty' }, error: null });
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      supabase.from.mockImplementation((table) => {
        if (table === 'mata_pelajaran') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
        if (table === 'mata_pelajaran_spesialisasi') return { select: vi.fn().mockReturnThis(), eq: mockEq };
        return {};
      });
      await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
    });
  });

  describe('getCorrelationStats', () => {
    it('18. should return error statistics', async () => {
      const mockErrors = Array(5).fill({ id: 1 });
      const mockGte = vi.fn().mockResolvedValue({ data: mockErrors, error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), gte: mockGte });
      await specializationController.getCorrelationStats(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
        data: expect.objectContaining({ 
          recent_errors: 5, 
          alert: false,
          errors: expect.any(Array)
        }) 
      }));
    });

    it('19. should return 500 if fetching stats fails', async () => {
      const mockGte = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Fail' } });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), gte: mockGte });
      await specializationController.getCorrelationStats(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
    });

    it('20. should trigger alert if error rate is high (> 50 in an hour)', async () => {
      const manyErrors = Array(60).fill({ id: 1 });
      const mockGte = vi.fn().mockResolvedValue({ data: manyErrors, error: null });
      supabase.from.mockReturnValue({ select: vi.fn().mockReturnThis(), gte: mockGte });
      await specializationController.getCorrelationStats(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ 
        data: expect.objectContaining({ 
          alert: true,
          recent_errors: 60
        }) 
      }));
    });
  });
});