import type { ZodType } from 'zod';
import type { NormalizedLlmResponse } from '../modules/ai/ai.types';
import { parseLlmJson } from './llm-parser.service';

export type FallbackExecutionResult<T> = {
  parsed: T;
  response: NormalizedLlmResponse;
  fallbackTriggered: boolean;
};

export const executeWithFallback = async <T>(
  prompt: string,
  schema: ZodType<T>,
  invokePrimary: (prompt: string) => Promise<NormalizedLlmResponse>,
  invokeFallback: (prompt: string) => Promise<NormalizedLlmResponse>,
): Promise<FallbackExecutionResult<T>> => {
  try {
    const response = await invokePrimary(prompt);
    return {
      parsed: parseLlmJson(response.content, schema),
      response,
      fallbackTriggered: false,
    };
  } catch {
    const response = await invokeFallback(prompt);
    return {
      parsed: parseLlmJson(response.content, schema),
      response,
      fallbackTriggered: true,
    };
  }
};
