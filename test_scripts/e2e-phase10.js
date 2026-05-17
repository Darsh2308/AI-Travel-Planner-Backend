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
  const registered = await request('POST', '/api/v1/auth/register', {
    expectedStatus: 201,
    body: {
      fullName: 'Phase Ten',
      email: `phase10-${RUN_ID}@example.com`,
      password: PASSWORD,
    },
  });
  const token = registered.data.tokens.accessToken;

  await request('PUT', '/api/v1/budget', {
    expectedStatus: 200,
    token,
    body: { currency: 'USD', total: 10000 },
  });

  const created = await request('POST', '/api/v1/trips', {
    expectedStatus: 201,
    token,
    body: {
      title: 'Editable itinerary checkpoint',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 1,
      budgetTier: 'standard',
      allocatedBudgetAmount: 200,
      estimatedCost: {
        flights: 0,
        accommodation: 0,
        food: 0,
        activities: 200,
        localTransport: 0,
        contingency: 0,
        total: 200,
      },
      itinerary: [
        {
          dayNumber: 1,
          title: 'Day 1',
          summary: 'Initial day',
          activities: [],
        },
      ],
    },
  });
  const tripId = created.data.trip.id;

  const added = await request('POST', `/api/v1/trips/${tripId}/activities`, {
    expectedStatus: 201,
    token,
    body: {
      dayNumber: 1,
      title: 'Louvre Museum',
      category: 'museum',
      location: 'Paris',
      estimatedCost: 100,
      preferredTimeSlot: '10:00',
    },
  });
  const activityId = added.data.trip.itinerary[0].activities[0]._id;
  assert.ok(activityId);

  await request('PATCH', `/api/v1/trips/${tripId}/activities/${activityId}`, {
    expectedStatus: 200,
    token,
    body: { estimatedCost: 120, notes: 'Updated ticket budget' },
  });

  const conflicts = await request('POST', '/api/v1/assistant/check-conflicts', {
    expectedStatus: 200,
    token,
    body: { tripId },
  });
  assert.equal(typeof conflicts.data.hasConflicts, 'boolean');

  const optimized = await request('POST', '/api/v1/assistant/optimize-trip', {
    expectedStatus: 200,
    token,
    body: { tripId, optimizationGoal: 'reduce cost' },
  });
  assert.ok(optimized.data.suggestions.length > 0);

  const alternatives = await request(
    'POST',
    '/api/v1/assistant/recommend-alternatives',
    {
      expectedStatus: 200,
      token,
      body: { tripId, affectedDay: 1, reason: 'budget concern' },
    },
  );
  assert.ok(alternatives.data.alternatives.length > 0);

  const score = await request('GET', `/api/v1/assistant/trips/${tripId}/score`, {
    expectedStatus: 200,
    token,
  });
  assert.ok(score.data.score.score >= 0);

  await request('DELETE', `/api/v1/trips/${tripId}/activities/${activityId}`, {
    expectedStatus: 200,
    token,
    body: { releaseBudget: true },
  });

  await request('DELETE', `/api/v1/trips/${tripId}`, {
    expectedStatus: 200,
    token,
  });

  console.log('\n[phase10-e2e] PASS: itinerary edits and assistant routes work.');
};

main().catch((error) => {
  console.error('\n[phase10-e2e] FAIL');
  console.error(error);
  process.exit(1);
});
