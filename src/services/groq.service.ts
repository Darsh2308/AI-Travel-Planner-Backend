import Groq from 'groq-sdk';
import { config } from '../config/env';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import type { NormalizedLlmResponse } from '../modules/ai/ai.types';

const getGroqClient = (): Groq => {
  if (!config.integrations.groqApiKey) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'GROQ_API_KEY is required for AI generation',
    );
  }

  return new Groq({
    apiKey: config.integrations.groqApiKey,
  });
};

const invokeModel = async (
  model: string,
  prompt: string,
): Promise<NormalizedLlmResponse> => {
  const startedAt = Date.now();
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_completion_tokens: 4096,
    messages: [
      {
        role: 'system',
        content:
          'You are a strict JSON API. Return valid JSON only. No markdown.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    content: response.choices[0]?.message?.content || '',
    model,
    latencyMs: Date.now() - startedAt,
    tokenUsage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
};

export const invokePrimaryModel = (
  prompt: string,
): Promise<NormalizedLlmResponse> => {
  return invokeModel(config.integrations.groqPrimaryModel, prompt);
};

export const invokeFallbackModel = (
  prompt: string,
): Promise<NormalizedLlmResponse> => {
  return invokeModel(config.integrations.groqFallbackModel, prompt);
};
