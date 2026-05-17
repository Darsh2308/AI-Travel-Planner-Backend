export type AiTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type NormalizedLlmResponse = {
  content: string;
  model: string;
  latencyMs: number;
  tokenUsage: AiTokenUsage;
};

export type TripGenerationInput = {
  userId: string;
  destinationCity: string;
  destinationCountry?: string;
  totalDays: number;
  budgetTier: string;
  startDate?: Date;
  endDate?: Date;
  preferredCurrency?: string;
  totalBudget?: number;
  travelStyle?: string;
  activityPreferences?: string[];
  dietaryPreferences?: string[];
  avoidActivities?: string[];
};

export type AiEstimatedCost = {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  localTransport: number;
  contingency: number;
  total: number;
};

export type AiTripGenerationResult = {
  itinerary: unknown[];
  estimatedCost: AiEstimatedCost;
  hotels: unknown[];
};

export type AiExecutionMetadata = {
  rawResponse: string;
  model: string;
  latencyMs: number;
  tokenUsage: AiTokenUsage;
  fallbackTriggered: boolean;
};

export type AiTripPlan = AiTripGenerationResult & {
  metadata: AiExecutionMetadata;
};
