import { AiLogModel } from '../../database/models/ai-log.model';
import {
  invokeFallbackModel,
  invokePrimaryModel,
} from '../../services/groq.service';
import { executeWithFallback } from '../../services/ai-fallback.service';
import type {
  AiEstimatedCost,
  AiExecutionMetadata,
  AiTripPlan,
  TripGenerationInput,
} from './ai.types';
import {
  aiEstimatedCostSchema,
  aiHotelSuggestionsSchema,
  aiTripGenerationSchema,
} from './ai.schemas';
import {
  buildBudgetPrompt,
  buildHotelSuggestionPrompt,
  buildTripGenerationPrompt,
} from './ai.prompts';

const logAiInteraction = async (
  input: {
    userId: string;
    tripId?: string;
    interactionType: string;
    prompt: string;
    rawResponse: string;
    parsedResponse: unknown;
    metadata: AiExecutionMetadata;
  },
): Promise<void> => {
  await AiLogModel.create({
    userId: input.userId,
    tripId: input.tripId,
    interactionType: input.interactionType,
    prompt: input.prompt,
    rawResponse: input.rawResponse,
    parsedResponse: input.parsedResponse,
    model: input.metadata.model,
    fallbackTriggered: input.metadata.fallbackTriggered,
    tokenUsage: input.metadata.tokenUsage,
    latencyMs: input.metadata.latencyMs,
  });
};

export const generateTripPlan = async (
  input: TripGenerationInput,
  tripId?: string,
): Promise<AiTripPlan> => {
  const prompt = await buildTripGenerationPrompt(input);
  const execution = await executeWithFallback(
    prompt,
    aiTripGenerationSchema,
    invokePrimaryModel,
    invokeFallbackModel,
  );

  const metadata: AiExecutionMetadata = {
    rawResponse: execution.response.content,
    model: execution.response.model,
    latencyMs: execution.response.latencyMs,
    tokenUsage: execution.response.tokenUsage,
    fallbackTriggered: execution.fallbackTriggered,
  };

  await logAiInteraction({
    userId: input.userId,
    tripId,
    interactionType: 'trip_generation',
    prompt,
    rawResponse: execution.response.content,
    parsedResponse: execution.parsed,
    metadata,
  });

  return {
    ...execution.parsed,
    metadata,
  };
};

export const estimateTripBudget = async (
  input: TripGenerationInput,
): Promise<{ estimatedCost: AiEstimatedCost; metadata: AiExecutionMetadata }> => {
  const prompt = await buildBudgetPrompt(input);
  const execution = await executeWithFallback(
    prompt,
    aiEstimatedCostSchema,
    invokePrimaryModel,
    invokeFallbackModel,
  );

  const metadata: AiExecutionMetadata = {
    rawResponse: execution.response.content,
    model: execution.response.model,
    latencyMs: execution.response.latencyMs,
    tokenUsage: execution.response.tokenUsage,
    fallbackTriggered: execution.fallbackTriggered,
  };

  await logAiInteraction({
    userId: input.userId,
    interactionType: 'budget_estimation',
    prompt,
    rawResponse: execution.response.content,
    parsedResponse: execution.parsed,
    metadata,
  });

  return {
    estimatedCost: execution.parsed,
    metadata,
  };
};

export const generateHotelSuggestions = async (
  input: TripGenerationInput,
): Promise<{ hotels: unknown[]; metadata: AiExecutionMetadata }> => {
  const prompt = await buildHotelSuggestionPrompt(input);
  const execution = await executeWithFallback(
    prompt,
    aiHotelSuggestionsSchema,
    invokePrimaryModel,
    invokeFallbackModel,
  );

  const metadata: AiExecutionMetadata = {
    rawResponse: execution.response.content,
    model: execution.response.model,
    latencyMs: execution.response.latencyMs,
    tokenUsage: execution.response.tokenUsage,
    fallbackTriggered: execution.fallbackTriggered,
  };

  await logAiInteraction({
    userId: input.userId,
    interactionType: 'hotel_suggestions',
    prompt,
    rawResponse: execution.response.content,
    parsedResponse: execution.parsed,
    metadata,
  });

  return {
    hotels: execution.parsed.hotels,
    metadata,
  };
};
