import { PromptTemplate } from '@langchain/core/prompts';
import type { TripGenerationInput } from './ai.types';

const tripGenerationTemplate = PromptTemplate.fromTemplate(`
You are an AI travel planning engine. Return strict JSON only.
Do not use markdown. Do not wrap the response in prose. Do not include comments.

Generate a trip plan for:
- destinationCity: {destinationCity}
- destinationCountry: {destinationCountry}
- totalDays: {totalDays}
- budgetTier: {budgetTier}
- startDate: {startDate}
- endDate: {endDate}
- preferredCurrency: {preferredCurrency}
- totalBudget: {totalBudget}
- travelStyle: {travelStyle}
- activityPreferences: {activityPreferences}
- dietaryPreferences: {dietaryPreferences}
- avoidActivities: {avoidActivities}

The JSON response must exactly match this top-level shape:
{{
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
          "rating": 0,
          "reviewCount": 0,
          "notes": "string",
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
  ],
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
  ]
}}

Rules:
- itinerary length must equal totalDays.
- estimatedCost.total must equal the sum of flights, accommodation, food, activities, localTransport, and contingency.
- Use the preferredCurrency as the hotel currency.
- Use no markdown and no prose.
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
