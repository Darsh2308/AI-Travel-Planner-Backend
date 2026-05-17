import { PromptTemplate } from '@langchain/core/prompts';
import type { TripGenerationInput } from './ai.types';

const tripGenerationTemplate = PromptTemplate.fromTemplate(`
You are an AI travel planning engine. Return strict JSON only.
Do not use markdown, prose, or comments.

Trip details:
- destination: {destinationCity}, {destinationCountry}
- days: {totalDays}
- budgetTier: {budgetTier}
- dates: {startDate} to {endDate}
- currency: {preferredCurrency}
- budget: {totalBudget}
- travelStyle: {travelStyle}
- activityPreferences: {activityPreferences}
- dietaryPreferences: {dietaryPreferences}
- avoidActivities: {avoidActivities}

Return exactly this JSON shape:
{{
  "estimatedCost": {{
    "flights": 0,
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "localTransport": 0,
    "contingency": 0,
    "total": 0
  }},
  "hotels": [
    {{
      "name": "string",
      "tier": "string",
      "address": "string",
      "nightlyRateEstimate": 0,
      "currency": "{preferredCurrency}",
      "rating": 0,
      "reviewCount": 0,
      "bookingOptions": []
    }}
  ],
  "itinerary": [
    {{
      "dayNumber": 1,
      "title": "string",
      "summary": "string",
      "dayStatus": "draft",
      "activities": [
        {{
          "title": "string",
          "description": "string",
          "category": "string",
          "locationName": "string",
          "address": "string",
          "estimatedCost": 0,
          "startTime": "09:00",
          "endTime": "11:00",
          "bookingRequired": false,
          "bookingOptions": []
        }}
      ],
      "weatherSnapshot": {{
        "weatherType": "",
        "advisoryMessage": "",
        "isOutdoorFriendly": true,
        "source": "ai_estimate"
      }}
    }}
  ]
}}

Rules:
- itinerary array length must equal {totalDays} exactly.
- Each day must have exactly 3 activities.
- estimatedCost.total must equal the sum of all other estimatedCost fields.
- currency must be {preferredCurrency} throughout.
- No markdown, no prose.
`);

const budgetTemplate = PromptTemplate.fromTemplate(`
Return strict JSON only. Estimate trip cost for {destinationCity}, {destinationCountry}.
Budget tier: {budgetTier}. Days: {totalDays}. Currency: {preferredCurrency}.
Return only:
{{
  "flights": 0,
  "accommodation": 0,
  "food": 0,
  "activities": 0,
  "localTransport": 0,
  "contingency": 0,
  "total": 0
}}
`);

const hotelTemplate = PromptTemplate.fromTemplate(`
Return strict JSON only. Suggest 3 hotels for {destinationCity}, {destinationCountry}.
Budget tier: {budgetTier}. Currency: {preferredCurrency}.
Return only:
{{
  "hotels": [
    {{
      "name": "string",
      "tier": "string",
      "address": "string",
      "nightlyRateEstimate": 0,
      "currency": "{preferredCurrency}",
      "rating": 0,
      "reviewCount": 0,
      "bookingOptions": []
    }}
  ]
}}
`);

const toPromptInput = (input: TripGenerationInput) => ({
  destinationCity: input.destinationCity,
  destinationCountry: input.destinationCountry || '',
  totalDays: String(input.totalDays),
  budgetTier: input.budgetTier,
  startDate: input.startDate?.toISOString() || '',
  endDate: input.endDate?.toISOString() || '',
  preferredCurrency: input.preferredCurrency || 'USD',
  totalBudget: String(input.totalBudget || 0),
  travelStyle: input.travelStyle || '',
  activityPreferences: (input.activityPreferences || []).join(', '),
  dietaryPreferences: (input.dietaryPreferences || []).join(', '),
  avoidActivities: (input.avoidActivities || []).join(', '),
});

export const buildTripGenerationPrompt = async (
  input: TripGenerationInput,
): Promise<string> => tripGenerationTemplate.format(toPromptInput(input));

export const buildBudgetPrompt = async (
  input: TripGenerationInput,
): Promise<string> => budgetTemplate.format(toPromptInput(input));

export const buildHotelSuggestionPrompt = async (
  input: TripGenerationInput,
): Promise<string> => hotelTemplate.format(toPromptInput(input));
