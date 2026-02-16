import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as specializationController from '../controllers/specialization.controller.js';
import supabase from '../config/supabase.js';

// Mock Supabase
vi.mock('../config/supabase.js', () => ({
  default: {
    from: vi.fn()
  }
}));

describe('Integration Scenarios - Registration Flow', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { params: {}, body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  // Scenario 1: Basic valid flow
  it('Scenario 1: Valid subject selection returns correlated specializations', async () => {
    const subjectId = 'math-id';
    mockReq.params.mataPelajaranId = subjectId;

    const mockSubject = { id: subjectId, name: 'Matematika' };
    const mockSpecs = [
      { spesialisasi: { id: 'alg-1', name: 'Aljabar' } },
      { spesialisasi: { id: 'geo-1', name: 'Geometri' } }
    ];

    supabase.from.mockImplementation((table) => {
      if (table === 'mata_pelajaran') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubject, error: null })
      };
      if (table === 'mata_pelajaran_spesialisasi') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockSpecs, error: null })
      };
      return {};
    });

    await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      data: expect.arrayContaining([
        expect.objectContaining({ name: 'Aljabar' })
      ])
    }));
  });

  // Scenario 2: Change subject flow
  it('Scenario 2: Changing subject triggers cache check and fresh fetch', async () => {
    mockReq.params.mataPelajaranId = 'subject-a';
    
    // Setup for first fetch
    supabase.from.mockImplementation((table) => {
      if (table === 'mata_pelajaran') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'a' }, error: null })
      };
      if (table === 'mata_pelajaran_spesialisasi') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      return {};
    });

    await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'db' }));

    // Second fetch with different ID
    const mockRes2 = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    mockReq.params.mataPelajaranId = 'subject-b';
    
    // Update mock for subject-b
    supabase.from.mockImplementation((table) => {
      if (table === 'mata_pelajaran') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'b' }, error: null })
      };
      if (table === 'mata_pelajaran_spesialisasi') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      return {};
    });

    await specializationController.getSpecializationsBySubject(mockReq, mockRes2, mockNext);

    expect(mockRes2.json).toHaveBeenCalledWith(expect.objectContaining({ source: 'db' }));
  });

  // Scenario 3: Submit with invalid correlation
  it('Scenario 3: Validation fails for mismatched subject-specialization', async () => {
    mockReq.body = { 
      mataPelajaranId: 'math-id', 
      spesialisasiId: 'phys-spec-id',
      userId: 'test-user'
    };

    supabase.from.mockImplementation((table) => {
      if (table === 'mata_pelajaran_spesialisasi') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      };
      if (table === 'correlation_errors') return {
        insert: vi.fn().mockResolvedValue({ error: null })
      };
      return {};
    });

    await specializationController.validateCorrelation(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      valid: false
    }));
  });

  // Scenario 4: Empty state handling
  it('Scenario 4: Subject with no specializations returns empty array', async () => {
    mockReq.params.mataPelajaranId = 'new-subject-id';
    
    supabase.from.mockImplementation((table) => {
      if (table === 'mata_pelajaran') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new' }, error: null })
      };
      if (table === 'mata_pelajaran_spesialisasi') return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      return {};
    });

    await specializationController.getSpecializationsBySubject(mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
  });
});
