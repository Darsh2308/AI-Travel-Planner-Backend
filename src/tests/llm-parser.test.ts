import { z } from 'zod';
import { parseLlmJson } from '../services/llm-parser.service';

const schema = z.object({
  name: z.string(),
  count: z.number(),
});

describe('LLM parser service', () => {
  it('parses raw JSON', () => {
    expect(parseLlmJson('{"name":"ok","count":1}', schema)).toEqual({
      name: 'ok',
      count: 1,
    });
  });

  it('parses fenced markdown JSON', () => {
    expect(
      parseLlmJson('```json\n{"name":"ok","count":2}\n```', schema),
    ).toEqual({
      name: 'ok',
      count: 2,
    });
  });

  it('repairs simple malformed JSON', () => {
    expect(parseLlmJson('{name:"ok",count:3,}', schema)).toEqual({
      name: 'ok',
      count: 3,
    });
  });

  it('rejects empty responses', () => {
    expect(() => parseLlmJson('', schema)).toThrow('LLM response was empty');
  });
});
