import { describe, it, expect, vi } from "vitest";
import { withRetry } from "../utils/supabaseRetry.js";

// Mock logger to avoid cluttering test output
vi.mock("../utils/logger.js", () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe("supabaseRetry Utility", () => {
  it("should return data on first attempt if successful", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
    const result = await withRetry(mockQuery);
    
    expect(result.data).toEqual({ id: 1 });
    expect(result.error).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("should retry on PGRST204 error and succeed if second attempt works", async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST204', message: 'Schema cache mismatch' } })
      .mockResolvedValueOnce({ data: { id: 2 }, error: null });
    
    // Use short delay for tests
    const result = await withRetry(mockQuery, { maxRetries: 3, initialDelay: 1 });
    
    expect(result.data).toEqual({ id: 2 });
    expect(result.error).toBeNull();
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("should retry with exponential backoff and fail after max retries", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ 
      data: null, 
      error: { code: 'PGRST204', message: 'Schema cache mismatch' } 
    });
    
    const result = await withRetry(mockQuery, { maxRetries: 3, initialDelay: 1 });
    
    expect(result.data).toBeNull();
    expect(result.error.code).toBe('PGRST204');
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("should NOT retry on other types of errors", async () => {
    const mockQuery = vi.fn().mockResolvedValue({ 
      data: null, 
      error: { code: '23505', message: 'Unique violation' } 
    });
    
    const result = await withRetry(mockQuery, { maxRetries: 3, initialDelay: 1 });
    
    expect(result.data).toBeNull();
    expect(result.error.code).toBe('23505');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("should handle unexpected exceptions that contain PGRST204", async () => {
    const mockQuery = vi.fn()
      .mockRejectedValueOnce(new Error("Unexpected error PGRST204 occurred"))
      .mockResolvedValueOnce({ data: { success: true }, error: null });
      
    const result = await withRetry(mockQuery, { maxRetries: 3, initialDelay: 1 });
    
    expect(result.data).toEqual({ success: true });
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});
