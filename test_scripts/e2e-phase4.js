/* eslint-disable no-console */
const path = require('node:path');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5000';
const RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const PASSWORD = 'StrongPass123';

const state = {
  userA: {
    fullName: 'DSP Phase4 A',
    email: `phase4-a-${RUN_ID}@example.com`,
    password: PASSWORD,
  },
  userB: {
    fullName: 'DSP Phase4 B',
    email: `phase4-b-${RUN_ID}@example.com`,
    password: PASSWORD,
  },
};

const requiredEnv = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
];

const logStep = (message) => console.log(`\n[phase4-e2e] ${message}`);

const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

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
  const body = await readJson(response);

  if (options.expectedStatus && response.status !== options.expectedStatus) {
    throw new Error(
      `${method} ${route} expected ${options.expectedStatus}, got ${response.status}: ${JSON.stringify(
        body,
      )}`,
    );
  }

  return { status: response.status, body, headers: response.headers };
};

const requireData = (response, key) => {
  assert.ok(response.body.data, 'response body must contain data');
  assert.ok(response.body.data[key], `response data must contain ${key}`);
  return response.body.data[key];
};

const register = async (user) => {
  const response = await request('POST', '/api/v1/auth/register', {
    expectedStatus: 201,
    body: user,
  });
  const payload = requireData(response, 'tokens');
  assert.ok(payload.accessToken, 'register response must include accessToken');
  assert.ok(payload.refreshToken, 'register response must include refreshToken');
  return response.body.data;
};

const login = async (email, password) => {
  const response = await request('POST', '/api/v1/auth/login', {
    expectedStatus: 200,
    body: { email, password },
  });
  return response.body.data;
};

const main = async () => {
  console.log('[phase4-e2e] Required backend .env variables:');
  for (const key of requiredEnv) {
    console.log(`  - ${key}${process.env[key] ? ' OK' : ' MISSING'}`);
  }
  console.log(`\n[phase4-e2e] Base URL: ${BASE_URL}`);

  logStep('health');
  const health = await request('GET', '/health', { expectedStatus: 200 });
  assert.equal(health.body.data.status, 'ok');

  logStep('auth register/login/refresh/me');
  const registeredA = await register(state.userA);
  await request('POST', '/api/v1/auth/register', {
    expectedStatus: 409,
    body: state.userA,
  });
  await request('POST', '/api/v1/auth/register', {
    expectedStatus: 400,
    body: {
      fullName: 'Weak Password',
      email: `weak-${RUN_ID}@example.com`,
      password: 'weak',
    },
  });

  const loginA = await login(state.userA.email, state.userA.password);
  await request('POST', '/api/v1/auth/login', {
    expectedStatus: 401,
    body: { email: state.userA.email, password: 'WrongPass123' },
  });
  await request('POST', '/api/v1/auth/login', {
    expectedStatus: 401,
    body: { email: `missing-${RUN_ID}@example.com`, password: PASSWORD },
  });
  await request('POST', '/api/v1/auth/login', {
    expectedStatus: 400,
    body: { password: PASSWORD },
  });

  const me = await request('GET', '/api/v1/auth/me', {
    expectedStatus: 200,
    token: loginA.tokens.accessToken,
  });
  assert.equal(me.body.data.user.email, state.userA.email);
  await request('GET', '/api/v1/auth/me', { expectedStatus: 401 });
  await request('GET', '/api/v1/auth/me', {
    expectedStatus: 401,
    token: 'invalid-token',
  });

  if (process.env.JWT_ACCESS_SECRET) {
    const expiredToken = jwt.sign(
      { sub: registeredA.user.id, email: state.userA.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' },
    );
    await request('GET', '/api/v1/auth/me', {
      expectedStatus: 401,
      token: expiredToken,
    });
  }

  const refresh = await request('POST', '/api/v1/auth/refresh', {
    expectedStatus: 200,
    body: { refreshToken: loginA.tokens.refreshToken },
  });
  assert.ok(refresh.body.data.tokens.accessToken);
  assert.ok(refresh.body.data.tokens.refreshToken);
  await request('POST', '/api/v1/auth/refresh', {
    expectedStatus: 401,
    body: { refreshToken: loginA.tokens.refreshToken },
  });

  const registeredB = await register(state.userB);

  logStep('profile');
  const profile = await request('GET', '/api/v1/users/profile', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
  });
  assert.equal(profile.body.data.profile.email, state.userA.email);

  const updatedProfile = await request('PATCH', '/api/v1/users/profile', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
    body: {
      fullName: 'DSP Phase4 Updated',
      phone: '+10000000000',
      country: 'India',
      city: 'Pune',
    },
  });
  assert.equal(updatedProfile.body.data.profile.city, 'Pune');

  const updatedPreferences = await request(
    'PATCH',
    '/api/v1/users/profile/preferences',
    {
      expectedStatus: 200,
      token: refresh.body.data.tokens.accessToken,
      body: {
        preferences: {
          travelStyle: 'relaxed',
          hotelTier: 'standard',
          preferredCurrency: 'USD',
          dietaryPreferences: ['vegetarian'],
          activityPreferences: ['museums', 'food'],
          avoidActivities: ['extreme sports'],
        },
      },
    },
  );
  assert.equal(updatedPreferences.body.data.profile.preferences.travelStyle, 'relaxed');

  logStep('budget');
  const budgetSet = await request('PUT', '/api/v1/budget', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
    body: { currency: 'USD', total: 10000 },
  });
  assert.equal(budgetSet.body.data.budget.totalBudget, 10000);
  assert.equal(budgetSet.body.data.budget.remainingBudget, 10000);

  await request('PUT', '/api/v1/budget', {
    expectedStatus: 400,
    token: refresh.body.data.tokens.accessToken,
    body: { currency: 'USD', total: -1 },
  });

  const budgetAllocated = await request('POST', '/api/v1/budget/allocate', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
    body: { amount: 5000, description: 'Trip allocation test' },
  });
  assert.equal(budgetAllocated.body.data.budget.allocatedBudget, 5000);
  assert.equal(budgetAllocated.body.data.budget.remainingBudget, 5000);

  await request('PUT', '/api/v1/budget', {
    expectedStatus: 400,
    token: refresh.body.data.tokens.accessToken,
    body: { currency: 'USD', total: 2000 },
  });

  const budgetReleased = await request('POST', '/api/v1/budget/release', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
    body: { amount: 1000, description: 'Release allocation test' },
  });
  assert.equal(budgetReleased.body.data.budget.allocatedBudget, 4000);
  assert.equal(budgetReleased.body.data.budget.remainingBudget, 6000);

  const ledger = await request('GET', '/api/v1/budget/ledger', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
  });
  assert.ok(Array.isArray(ledger.body.data.ledger));

  logStep('trip CRUD and ownership');
  const badTrip = await request('POST', '/api/v1/trips', {
    expectedStatus: 400,
    token: refresh.body.data.tokens.accessToken,
    body: { totalDays: 0, budgetTier: 'medium' },
  });
  assert.equal(badTrip.body.success, false);

  const createdTrip = await request('POST', '/api/v1/trips', {
    expectedStatus: 201,
    token: refresh.body.data.tokens.accessToken,
    body: {
      destinationCity: 'Paris',
      destinationCountry: 'France',
      totalDays: 5,
      budgetTier: 'standard',
      estimatedCost: {
        flights: 700,
        accommodation: 900,
        food: 350,
        activities: 300,
        localTransport: 120,
        contingency: 130,
        total: 2500,
      },
      itinerary: [
        {
          dayNumber: 1,
          title: 'Arrival',
          summary: 'Arrive and settle in',
          activities: [
            {
              title: 'Evening walk',
              category: 'sightseeing',
              locationName: 'Seine',
              estimatedCost: 0,
            },
          ],
        },
      ],
    },
  });
  const trip = requireData(createdTrip, 'trip');
  assert.equal(trip.destinationCity, 'Paris');
  assert.ok(trip.id);

  const listedTrips = await request('GET', '/api/v1/trips', {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
  });
  assert.ok(
    listedTrips.body.data.trips.some((item) => item.id === trip.id),
    'created trip must appear in owner trip list',
  );

  const fetchedTrip = await request('GET', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
  });
  assert.equal(fetchedTrip.body.data.trip.id, trip.id);

  await request('GET', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 404,
    token: registeredB.tokens.accessToken,
  });

  await request('GET', '/api/v1/trips/not-a-valid-id', {
    expectedStatus: 400,
    token: refresh.body.data.tokens.accessToken,
  });

  const updatedTrip = await request('PATCH', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
    body: {
      title: 'Paris MVP checkpoint',
      tripStatus: 'planned',
    },
  });
  assert.equal(updatedTrip.body.data.trip.title, 'Paris MVP checkpoint');
  assert.equal(updatedTrip.body.data.trip.tripStatus, 'planned');

  await request('DELETE', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 200,
    token: refresh.body.data.tokens.accessToken,
  });
  await request('GET', `/api/v1/trips/${trip.id}`, {
    expectedStatus: 404,
    token: refresh.body.data.tokens.accessToken,
  });

  await request('POST', '/api/v1/auth/logout', {
    expectedStatus: 200,
    body: { refreshToken: refresh.body.data.tokens.refreshToken },
  });

  console.log('\n[phase4-e2e] PASS: Phase 0-4 endpoint checkpoint completed.');
};

main().catch((error) => {
  console.error('\n[phase4-e2e] FAIL');
  console.error(error);
  process.exit(1);
});
