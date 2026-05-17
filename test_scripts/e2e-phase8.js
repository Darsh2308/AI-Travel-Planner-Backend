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
  console.log('[phase8-e2e] Required .env variables:');
  for (const key of [
    'MONGO_URI',
    'MONGO_DB_NAME',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'OPENWEATHER_API_KEY',
    'OPENWEATHER_BASE_URL',
  ]) {
    console.log(`  - ${key}${process.env[key] ? ' OK' : ' MISSING'}`);
  }

  const registered = await request('POST', '/api/v1/auth/register', {
    expectedStatus: 201,
    body: {
      fullName: 'Phase Eight',
      email: `phase8-${RUN_ID}@example.com`,
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
      title: 'Paris concierge checkpoint',
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 1,
      budgetTier: 'standard',
      allocatedBudgetAmount: 1000,
      estimatedCost: {
        flights: 250,
        accommodation: 300,
        food: 150,
        activities: 150,
        localTransport: 50,
        contingency: 100,
        total: 1000,
      },
      hotelRecommendations: [
        {
          name: 'Hotel Lumiere',
          tier: 'standard',
          address: 'Paris, France',
          nightlyRateEstimate: 180,
          currency: 'USD',
          rating: 4.2,
          reviewCount: 100,
          bookingOptions: [],
        },
      ],
      itinerary: [
        {
          dayNumber: 1,
          title: 'Paris classics',
          summary: 'Museum and landmark day',
          activities: [
            {
              title: 'Louvre Museum',
              description: 'Visit the Louvre collection',
              category: 'museum',
              locationName: 'Louvre Museum',
              address: 'Paris, France',
              estimatedCost: 40,
              startTime: '10:00',
              endTime: '13:00',
              bookingRequired: false,
              rating: 0,
              reviewCount: 0,
              notes: '',
              bookingOptions: [],
            },
          ],
        },
      ],
    },
  });

  const trip = created.data.trip;
  assert.ok(trip.id, 'trip id is required');

  const weather = await request('GET', `/api/v1/trips/${trip.id}/weather`, {
    expectedStatus: 200,
    token,
  });
  assert.ok(weather.data.trip.itinerary[0].weatherSnapshot);
  assert.ok(
    typeof weather.data.trip.itinerary[0].weatherSnapshot.isOutdoorFriendly ===
      'boolean',
  );

  const hotels = await request('GET', `/api/v1/trips/${trip.id}/hotels`, {
    expectedStatus: 200,
    token,
  });
  assert.ok(hotels.data.hotels.length > 0, 'hotels must exist');
  const hotelId = hotels.data.hotels[0]._id;
  const hotelBooking = await request(
    'GET',
    `/api/v1/trips/${trip.id}/hotels/${hotelId}/booking-options`,
    { expectedStatus: 200, token },
  );
  assert.ok(hotelBooking.data.bookingOptions.length > 0);

  const fetched = await request('GET', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token,
  });
  const activityId = fetched.data.trip.itinerary[0].activities[0]._id;
  const activityBooking = await request(
    'GET',
    `/api/v1/trips/${trip.id}/activities/${activityId}/booking-options`,
    { expectedStatus: 200, token },
  );
  assert.ok(activityBooking.data.bookingOptions.length > 0);

  await request('DELETE', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token,
  });

  console.log(
    '\n[phase8-e2e] PASS: weather, hotel booking, and activity booking routes work.',
  );
};

main().catch((error) => {
  console.error('\n[phase8-e2e] FAIL');
  console.error(error);
  process.exit(1);
});
