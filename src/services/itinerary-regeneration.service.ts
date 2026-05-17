import { AiLogModel } from '../database/models/ai-log.model';
import type { TripDocument } from '../database/models/trip.model';
import * as aiService from '../modules/ai/ai.service';

export const buildContextualRegenerationPrompt = (
  trip: TripDocument,
  dayNumber: number,
  regenerationIntent: string,
  customPrompt = '',
): string => {
  const targetDay = trip.itinerary.find((day) => day.dayNumber === dayNumber);
  const surroundingDays = trip.itinerary
    .filter((day) => Math.abs(day.dayNumber - dayNumber) <= 1)
    .map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      summary: day.summary,
    }));

  return JSON.stringify({
    task: 'Regenerate one itinerary day only',
    destination: `${trip.destinationCity}, ${trip.destinationCountry}`,
    budgetTier: trip.budgetTier,
    remainingAllocatedBudget: trip.allocatedBudgetAmount,
    targetDay: targetDay?.toObject?.() ?? targetDay,
    weatherContext: targetDay?.weatherSnapshot,
    surroundingDays,
    regenerationIntent,
    customPrompt,
    rules: [
      'Return one day plan only',
      'Preserve the requested dayNumber',
      'Avoid duplicating surrounding days',
      'Respect weather context and budget tier',
    ],
  });
};

export const regenerateSpecificDay = async (
  userId: string,
  trip: TripDocument,
  dayNumber: number,
  regenerationIntent: string,
  customPrompt = '',
) => {
  const originalDay = trip.itinerary.find((day) => day.dayNumber === dayNumber);
  const prompt = buildContextualRegenerationPrompt(
    trip,
    dayNumber,
    regenerationIntent,
    customPrompt,
  );

  const generated = await aiService.generateTripPlan(
    {
      userId,
      destinationCity: trip.destinationCity,
      destinationCountry: trip.destinationCountry,
      totalDays: 1,
      budgetTier: trip.budgetTier,
      startDate: originalDay?.weatherSnapshot?.forecastDate || undefined,
      travelStyle: regenerationIntent,
      avoidActivities: regenerationIntent.toLowerCase().includes('avoid')
        ? [regenerationIntent]
        : [],
    },
    trip._id.toString(),
  );

  await AiLogModel.create({
    userId,
    tripId: trip._id,
    interactionType: 'day_regeneration_audit',
    prompt,
    rawResponse: generated.metadata.rawResponse,
    parsedResponse: {
      originalDay: originalDay?.toObject?.() ?? originalDay,
      regeneratedDay: generated.itinerary[0],
      regenerationIntent,
      customPrompt,
    },
    model: generated.metadata.model,
    fallbackTriggered: generated.metadata.fallbackTriggered,
    tokenUsage: generated.metadata.tokenUsage,
    latencyMs: generated.metadata.latencyMs,
  });

  return {
    ...(typeof generated.itinerary[0] === 'object' && generated.itinerary[0] !== null
      ? (generated.itinerary[0] as Record<string, unknown>)
      : {}),
    dayNumber,
    weatherSnapshot: originalDay?.weatherSnapshot,
  };
};

export const replaceDayPlan = (
  itinerary: unknown[],
  dayNumber: number,
  replacement: unknown,
) =>
  itinerary.map((day) => {
    const current = day as { dayNumber?: number };
    return current.dayNumber === dayNumber ? replacement : day;
  });
