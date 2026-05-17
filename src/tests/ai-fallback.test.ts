import { z } from 'zod';
import { executeWithFallback } from '../services/ai-fallback.service';

const schema = z.object({
  ok: z.boolean(),
});

const response = (content: string, model: string) => ({
  content,
  model,
  latencyMs: 10,
  tokenUsage: {
    promptTokens: 1,
    completionTokens: 1,
    totalTokens: 2,
  },
});

describe('AI fallback service', () => {
  it('uses primary model when parsing succeeds', async () => {
    const result = await executeWithFallback(
      'prompt',
      schema,
      jest.fn().mockResolvedValue(response('{"ok":true}', 'primary')),
      jest.fn().mockResolvedValue(response('{"ok":true}', 'fallback')),
    );

    expect(result.fallbackTriggered).toBe(false);
    expect(result.response.model).toBe('primary');
    expect(result.parsed.ok).toBe(true);
  });

  it('uses fallback model when primary fails', async () => {
    const result = await executeWithFallback(
      'prompt',
      schema,
      jest.fn().mockRejectedValue(new Error('timeout')),
      jest.fn().mockResolvedValue(response('{"ok":true}', 'fallback')),
    );

    expect(result.fallbackTriggered).toBe(true);
    expect(result.response.model).toBe('fallback');
  });

  it('uses fallback model when primary returns malformed JSON', async () => {
    const result = await executeWithFallback(
      'prompt',
      schema,
      jest.fn().mockResolvedValue(response('', 'primary')),
      jest.fn().mockResolvedValue(response('{"ok":true}', 'fallback')),
    );

    expect(result.fallbackTriggered).toBe(true);
  });
});
