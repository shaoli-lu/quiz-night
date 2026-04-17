import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const limitMock = vi.fn();
  const eqMock = vi.fn().mockReturnThis();
  const selectMock = vi.fn().mockReturnThis();
  const singleMock = vi.fn();
  const insertMock = vi.fn().mockReturnThis();
  
  return {
    supabase: {
      from: vi.fn((table: string) => {
        const queryBuilder: any = {
          select: vi.fn((_cols: string) => queryBuilder),
          eq: vi.fn((_col: string, _val: any) => queryBuilder),
          limit: limitMock,
          insert: vi.fn((_data: any) => queryBuilder),
          single: singleMock,
        };
        return queryBuilder;
      }),
    },
  };
});

// Mock fetch for OpenTDB
global.fetch = vi.fn();

describe('POST /api/create-room fallback logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new Request('http://localhost/api/create-room', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  };

  it('should fallback to Supabase when OpenTDB fails (e.g. 500 error)', async () => {
    // 1. Force OpenTDB fetch to fail
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // 2. Setup Supabase to return some valid fallback questions
    const mockQuestions = Array.from({ length: 10 }).map((_, i) => ({
      question: `Fallback Question ${i}`,
      correct_answer: 'True',
      incorrect_answers: ['False']
    }));

    // Mock .limit() responses - this is called for fallback questions
    const limitMock = vi.fn().mockResolvedValue({ data: mockQuestions, error: null });
    // Keep reference to mock for supabase.from('questions')...limit()
    
    // We also need to mock room and player creation
    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: { code: 'ABCD' }, error: null }) // Room create
      .mockResolvedValueOnce({ data: { id: 123 }, error: null });     // Player create
      
    // Update our supabase mock for this specific test
    (supabase.from as any).mockImplementation((table: string) => {
      const qb: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: limitMock,
        insert: vi.fn().mockReturnThis(),
        single: singleMock,
      };
      return qb;
    });

    const req = createMockRequest({ hostName: 'TestHost', category: 'any', difficulty: 'any' });
    const res = await POST(req);
    const json = await res.json();

    expect(fetch).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('questions');
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('roomCode', 'ABCD');
    expect(json).toHaveProperty('playerId', 123);
  });
  
  it('should fall back to looser criteria if exact category/difficulty match fails in Supabase', async () => {
     // 1. Force OpenTDB fetch to fail
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    // We want the primary fallback to fail (return <10 records)
    const exactMatchMock = { data: [{ question: 'Only 1', correct_answer: 'A', incorrect_answers: ['B'] }], error: null };
    // And the looser fallback to succeed
    const looseQuestionsMock = Array.from({ length: 15 }).map((_, i) => ({
      question: `Loose Question ${i}`,
      correct_answer: 'A',
      incorrect_answers: ['B']
    }));
    const looseMatchMock = { data: looseQuestionsMock, error: null };

    const limitMock = vi.fn()
      .mockResolvedValueOnce(exactMatchMock) // First call to limit()
      .mockResolvedValueOnce(looseMatchMock); // Second call to limit()

    const singleMock = vi.fn()
      .mockResolvedValueOnce({ data: { code: 'WXYZ' }, error: null }) 
      .mockResolvedValueOnce({ data: { id: 456 }, error: null });
      
    (supabase.from as any).mockImplementation((table: string) => {
      const qb: any = {
         select: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         limit: limitMock,
         insert: vi.fn().mockReturnThis(),
         single: singleMock,
      };
      return qb;
    });
    
    const req = createMockRequest({ hostName: 'TestHost2', category: '9', difficulty: 'hard' });
    const res = await POST(req);
    const json = await res.json();

    expect(fetch).toHaveBeenCalled();
    // Should have tried questions table multiple times due to fallback
    const questionTableCalls = (supabase.from as any).mock.calls.filter((call: any) => call[0] === 'questions');
    expect(questionTableCalls.length).toBeGreaterThan(1);
    
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('roomCode', 'WXYZ');
  });

  it('should return error 500 when both OpenTDB and Supabase throw errors/have no data', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const limitMock = vi.fn().mockResolvedValue({ data: [], error: { message: 'Database down' } });
    
    (supabase.from as any).mockImplementation((table: string) => {
      const qb: any = {
         select: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         limit: limitMock,
      };
      return qb;
    });

    const req = createMockRequest({ hostName: 'HostFail', category: 'any', difficulty: 'any' });
    const res = await POST(req);
    const json = await res.json();

    expect(fetch).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(json).toHaveProperty('error', 'Could not fetch questions from Trivia Database or Fallback.');
  });
});
