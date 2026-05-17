import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from '../config/env';
import { ApiError } from '../utils/api-error';
import { HTTP_STATUS } from '../utils/constants';
import type { NormalizedLlmResponse } from '../modules/ai/ai.types';

const getGroqModel = (model: string): ChatGroq => {
  if (!config.integrations.groqApiKey) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'GROQ_API_KEY is required for AI generation',
    );
  }

  return new ChatGroq({
    apiKey: config.integrations.groqApiKey,
    model,
    temperature: 0.2,
    maxTokens: 32768,
  });
};

const invokeModel = async (
  model: string,
  prompt: string,
): Promise<NormalizedLlmResponse> => {
  const startedAt = Date.now();
  const llm = getGroqModel(model);

  const response = await llm.invoke([
    new SystemMessage('You are a strict JSON API. Return valid JSON only. No markdown.'),
    new HumanMessage(prompt),
  ]);

  const content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  const usage = response.usage_metadata;

  return {
    content,
    model,
    latencyMs: Date.now() - startedAt,
    tokenUsage: {
      promptTokens: usage?.input_tokens ?? 0,
      completionTokens: usage?.output_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
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
