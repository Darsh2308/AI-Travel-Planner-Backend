/* eslint-disable no-console */
const path = require('node:path');
const assert = require('node:assert/strict');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5000';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const PASSWORD = 'StrongPass123';

const request = async (method, route, options = {}) => {
  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (options.expectedStatus && response.status !== options.expectedStatus) {
    throw new Error(
      `${method} ${route} expected ${options.expectedStatus}, got ${response.status}: ${JSON.stringify(
        body,
      )}`,
    );
  }

  return body;
};

const main = async () => {
  console.log('[phase5-e2e] Required .env variables:');
  for (const key of [
    'MONGO_URI',
    'MONGO_DB_NAME',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'GROQ_API_KEY',
    'GROQ_PRIMARY_MODEL',
    'GROQ_FALLBACK_MODEL',
  ]) {
    console.log(`  - ${key}${process.env[key] ? ' OK' : ' MISSING'}`);
  }

  const email = `phase5-${RUN_ID}@example.com`;
  const registered = await request('POST', '/api/v1/auth/register', {
    expectedStatus: 201,
    body: {
      fullName: 'Phase Five',
      email,
      password: PASSWORD,
      preferences: {
        travelStyle: 'relaxed',
        hotelTier: 'standard',
        preferredCurrency: 'USD',
        dietaryPreferences: [],
        activityPreferences: ['museums', 'food'],
        avoidActivities: [],
      },
    },
  });
  const token = registered.data.tokens.accessToken;

  await request('PUT', '/api/v1/budget', {
    expectedStatus: 200,
    token,
    body: {
      currency: 'USD',
      total: 10000,
    },
  });

  const created = await request('POST', '/api/v1/trips', {
    expectedStatus: 201,
    token,
    body: {
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 2,
      budgetTier: 'standard',
      generateWithAi: true,
    },
  });

  const trip = created.data.trip;
  assert.ok(trip.id, 'trip id must exist');
  assert.ok(Array.isArray(trip.itinerary), 'itinerary must be an array');
  assert.equal(trip.itinerary.length, 2, 'itinerary must match totalDays');
  assert.ok(trip.estimatedCost.total > 0, 'estimated total must be positive');
  assert.ok(
    Array.isArray(trip.hotelRecommendations),
    'hotel recommendations must be persisted',
  );

  const fetched = await request('GET', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token,
  });
  assert.equal(fetched.data.trip.id, trip.id);
  assert.equal(fetched.data.trip.itinerary.length, 2);

  const budget = await request('GET', '/api/v1/budget', {
    expectedStatus: 200,
    token,
  });
  assert.equal(
    budget.data.budget.allocatedBudget,
    trip.allocatedBudgetAmount,
    'budget allocation must match trip allocation',
  );

  await request('DELETE', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token,
  });

  console.log('\n[phase5-e2e] PASS: AI trip generation persisted and allocated budget.');
};

main().catch((error) => {
  console.error('\n[phase5-e2e] FAIL');
  console.error(error);
  process.exit(1);
});
