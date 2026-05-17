export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'AI Travel Planner API',
    version: '0.1.0',
    description: 'Backend API for planning trips with budget, preference, weather, and AI modules.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
    {
      url: 'https://ai-travel-planner-backend-zma9.onrender.com',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'System',
    },
    {
      name: 'Auth',
    },
    {
      name: 'Users',
    },
    {
      name: 'Budget',
    },
    {
      name: 'Trips',
    },
    {
      name: 'AI',
    },
    {
      name: 'Weather',
    },
    {
      name: 'Hotels',
    },
    {
      name: 'Activities',
    },
    {
      name: 'Itinerary',
    },
    {
      name: 'Assistant',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    statusCode: {
                      type: 'number',
                      example: 200,
                    },
                    message: {
                      type: 'string',
                      example: 'Server is healthy',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'ok',
                        },
                      },
                      required: ['status'],
                    },
                  },
                  required: ['success', 'statusCode', 'message', 'data'],
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
          },
          '400': {
            description: 'Validation failed or duplicate email',
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
          },
          '401': {
            description: 'Invalid email or password',
          },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and revoke a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RefreshRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout successful',
          },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token and issue new tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RefreshRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
          },
          '401': {
            description: 'Invalid refresh token',
          },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Current user fetched',
          },
          '401': {
            description: 'Invalid or expired access token',
          },
        },
      },
    },
    '/api/v1/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profile fetched' },
          '401': { description: 'Invalid or expired access token' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '400': { description: 'Validation failed' },
        },
      },
    },
    '/api/v1/users/profile/preferences': {
      patch: {
        tags: ['Users'],
        summary: 'Update current user preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePreferencesRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Preferences updated' },
          '400': { description: 'Validation failed' },
        },
      },
    },
    '/api/v1/budget': {
      get: {
        tags: ['Budget'],
        summary: 'Get current budget',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Budget fetched' },
        },
      },
      put: {
        tags: ['Budget'],
        summary: 'Update total budget and currency',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBudgetRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Budget updated' },
          '400': { description: 'Invalid budget' },
        },
      },
    },
    '/api/v1/budget/allocate': {
      post: {
        tags: ['Budget'],
        summary: 'Allocate budget',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BudgetAllocationRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Budget allocated' },
          '400': { description: 'Insufficient remaining budget' },
        },
      },
    },
    '/api/v1/budget/release': {
      post: {
        tags: ['Budget'],
        summary: 'Release allocated budget',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BudgetAllocationRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Budget released' },
          '400': { description: 'Invalid release amount' },
        },
      },
    },
    '/api/v1/budget/ledger': {
      get: {
        tags: ['Budget'],
        summary: 'Get budget ledger entries',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Budget ledger fetched' },
        },
      },
    },
    '/api/v1/trips': {
      post: {
        tags: ['Trips'],
        summary: 'Create a trip',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTripRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Trip created' },
          '400': { description: 'Validation failed' },
        },
      },
      get: {
        tags: ['Trips'],
        summary: 'List owned trips',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Trips fetched' },
        },
      },
    },
    '/api/v1/ai/trips/generate': {
      post: {
        tags: ['AI'],
        summary: 'Generate a structured AI trip plan without persisting it',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTripRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Trip plan generated' },
          '400': { description: 'Invalid request or invalid AI response' },
          '500': { description: 'AI provider configuration or execution failure' },
        },
      },
    },
    '/api/v1/trips/{tripId}/weather': {
      get: {
        tags: ['Weather'],
        summary: 'Fetch and persist day-wise weather intelligence',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Weather enriched' },
          '404': { description: 'Trip or city not found' },
        },
      },
    },
    '/api/v1/trips/{tripId}/weather/review': {
      post: {
        tags: ['Weather'],
        summary: 'Review a weather conflict decision checkpoint',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['affectedDay', 'userDecision'],
                properties: {
                  affectedDay: { type: 'integer', minimum: 1 },
                  userDecision: {
                    type: 'string',
                    enum: ['accept_risk', 'regenerate', 'dismiss'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Weather review saved' },
        },
      },
    },
    '/api/v1/trips/{tripId}/regenerate-weather-impacted-day': {
      post: {
        tags: ['Weather'],
        summary: 'Regenerate one day with weather-safe alternatives',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['affectedDay'],
                properties: {
                  affectedDay: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Weather impacted day regenerated' },
        },
      },
    },
    '/api/v1/trips/{tripId}/hotels': {
      get: {
        tags: ['Hotels'],
        summary: 'Get enriched hotel recommendations',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Hotels fetched' } },
      },
    },
    '/api/v1/trips/{tripId}/hotels/{hotelId}/booking-options': {
      get: {
        tags: ['Hotels'],
        summary: 'Get booking options for a hotel recommendation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'hotelId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Hotel booking options fetched' } },
      },
    },
    '/api/v1/trips/{tripId}/activities/{activityId}/booking-options': {
      get: {
        tags: ['Activities'],
        summary: 'Get booking options for an itinerary activity',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Activity booking options fetched' } },
      },
    },
    '/api/v1/trips/{tripId}/activities': {
      post: {
        tags: ['Itinerary'],
        summary: 'Add an activity to a trip day',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddActivityRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'Activity added' },
          '400': { description: 'Validation or budget failure' },
        },
      },
    },
    '/api/v1/trips/{tripId}/activities/{activityId}': {
      patch: {
        tags: ['Itinerary'],
        summary: 'Update an itinerary activity',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateActivityRequest' },
            },
          },
        },
        responses: { '200': { description: 'Activity updated' } },
      },
      delete: {
        tags: ['Itinerary'],
        summary: 'Remove an itinerary activity',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'activityId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'releaseBudget',
            in: 'query',
            required: false,
            schema: { type: 'boolean', default: true },
            description: 'Whether to release the activity cost back to the budget ledger.',
          },
        ],
        responses: { '200': { description: 'Activity removed' } },
      },
    },
    '/api/v1/trips/{tripId}/itinerary/day/{day}/regenerate': {
      patch: {
        tags: ['Itinerary'],
        summary: 'Regenerate a specific itinerary day',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'day', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegenerateDayRequest' },
            },
          },
        },
        responses: { '200': { description: 'Day regenerated' } },
      },
    },
    '/api/v1/assistant/optimize-trip': {
      post: {
        tags: ['Assistant'],
        summary: 'Generate smart trip optimization suggestions',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OptimizeTripRequest' },
            },
          },
        },
        responses: { '200': { description: 'Trip optimization generated' } },
      },
    },
    '/api/v1/assistant/check-conflicts': {
      post: {
        tags: ['Assistant'],
        summary: 'Check itinerary conflicts',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CheckConflictsRequest' },
            },
          },
        },
        responses: { '200': { description: 'Conflict report generated' } },
      },
    },
    '/api/v1/assistant/recommend-alternatives': {
      post: {
        tags: ['Assistant'],
        summary: 'Recommend alternatives for a day/reason',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecommendAlternativesRequest' },
            },
          },
        },
        responses: { '200': { description: 'Alternatives generated' } },
      },
    },
    '/api/v1/assistant/trips/{tripId}/score': {
      get: {
        tags: ['Assistant'],
        summary: 'Get itinerary health score',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Itinerary score generated' } },
      },
    },
    '/api/v1/trips/{tripId}': {
      get: {
        tags: ['Trips'],
        summary: 'Get one owned trip',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Trip fetched' },
          '400': { description: 'Invalid tripId' },
          '404': { description: 'Trip not found' },
        },
      },
      patch: {
        tags: ['Trips'],
        summary: 'Update one owned trip',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTripRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'Trip updated' },
          '400': { description: 'Validation failed or invalid tripId' },
          '404': { description: 'Trip not found' },
        },
      },
      delete: {
        tags: ['Trips'],
        summary: 'Delete one owned trip',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Trip deleted' },
          '400': { description: 'Invalid tripId' },
          '404': { description: 'Trip not found' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: {
            type: 'string',
            example: 'Aarav Patil',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'aarav@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password1',
          },
          phone: {
            type: 'string',
            example: '+14155552671',
          },
          country: {
            type: 'string',
            example: 'India',
          },
          city: {
            type: 'string',
            example: 'Pune',
          },
          avatarUrl: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/avatar.jpg',
          },
          preferences: {
            $ref: '#/components/schemas/UpdatePreferencesRequest/properties/preferences',
          },
          budgetLedger: {
            type: 'object',
            description: 'Initial budget. Only totalBudget and currency are accepted.',
            properties: {
              totalBudget: { type: 'number', minimum: 0, example: 3000 },
              currency: { type: 'string', minLength: 3, maxLength: 3, example: 'USD' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            format: 'password',
          },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
          },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          fullName: {
            type: 'string',
            example: 'Aarav Patil',
          },
        },
      },
      UpdatePreferencesRequest: {
        type: 'object',
        required: ['preferences'],
        properties: {
          preferences: {
            type: 'object',
            properties: {
              travelStyle: {
                type: 'string',
                enum: ['adventure', 'cultural', 'relaxation', 'family', 'business', 'backpacker', 'luxury', 'eco', ''],
              },
              hotelTier: {
                type: 'string',
                enum: ['budget', 'standard', 'premium', 'luxury', ''],
              },
              preferredCurrency: {
                type: 'string',
                minLength: 3,
                maxLength: 3,
                example: 'USD',
              },
              dietaryPreferences: {
                type: 'array',
                items: { type: 'string' },
                example: ['vegetarian', 'gluten-free'],
              },
              activityPreferences: {
                type: 'array',
                items: { type: 'string' },
                example: ['hiking', 'museums'],
              },
              avoidActivities: {
                type: 'array',
                items: { type: 'string' },
                example: ['extreme sports'],
              },
            },
          },
        },
      },
      UpdateBudgetRequest: {
        type: 'object',
        required: ['currency', 'total'],
        properties: {
          currency: {
            type: 'string',
            minLength: 3,
            maxLength: 3,
            example: 'USD',
          },
          total: {
            type: 'number',
            minimum: 0,
            example: 2500,
          },
        },
      },
      BudgetAllocationRequest: {
        type: 'object',
        required: ['amount', 'description'],
        properties: {
          amount: {
            type: 'number',
            exclusiveMinimum: 0,
            example: 450,
          },
          description: {
            type: 'string',
            example: 'Flight booking hold',
          },
        },
      },
      CreateTripRequest: {
        type: 'object',
        required: ['destinationCity', 'totalDays', 'budgetTier'],
        properties: {
          title: {
            type: 'string',
            example: 'Goa anniversary trip',
          },
          destinationCity: {
            type: 'string',
            example: 'Goa',
          },
          destinationCountry: {
            type: 'string',
            example: 'India',
          },
          latitude: {
            type: 'number',
            example: 15.4909,
          },
          longitude: {
            type: 'number',
            example: 73.8278,
          },
          startDate: {
            type: 'string',
            format: 'date-time',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
          },
          totalDays: {
            type: 'integer',
            minimum: 1,
            example: 4,
          },
          budgetTier: {
            type: 'string',
            enum: ['budget', 'standard', 'premium', 'luxury'],
          },
          allocatedBudgetAmount: {
            type: 'number',
            minimum: 0,
          },
          estimatedCost: {
            $ref: '#/components/schemas/EstimatedCost',
          },
          tripStatus: {
            type: 'string',
            enum: ['draft', 'planned', 'booked', 'completed', 'cancelled'],
            description: 'Client-settable statuses. weather_review_pending is set by the system.',
          },
          itinerary: {
            type: 'array',
            items: { $ref: '#/components/schemas/DayPlan' },
          },
          hotelRecommendations: {
            type: 'array',
            items: { $ref: '#/components/schemas/HotelRecommendation' },
          },
          decisionCheckpoints: {
            type: 'array',
            items: { $ref: '#/components/schemas/DecisionCheckpoint' },
          },
          generateWithAi: {
            type: 'boolean',
            description:
              'When true, POST /api/v1/trips generates itinerary, estimated cost, and hotel recommendations before persisting.',
            default: false,
          },
        },
      },
      UpdateTripRequest: {
        type: 'object',
        minProperties: 1,
        description: 'All fields optional; at least one must be provided.',
        properties: {
          title: { type: 'string', example: 'Goa anniversary trip' },
          destinationCity: { type: 'string', example: 'Goa' },
          destinationCountry: { type: 'string', example: 'India' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          totalDays: { type: 'integer', minimum: 1 },
          budgetTier: {
            type: 'string',
            enum: ['budget', 'standard', 'premium', 'luxury'],
          },
          tripStatus: {
            type: 'string',
            enum: ['draft', 'planned', 'booked', 'completed', 'cancelled'],
          },
          allocatedBudgetAmount: { type: 'number', minimum: 0 },
          estimatedCost: { $ref: '#/components/schemas/EstimatedCost' },
          itinerary: { type: 'array', items: { $ref: '#/components/schemas/DayPlan' } },
          hotelRecommendations: {
            type: 'array',
            items: { $ref: '#/components/schemas/HotelRecommendation' },
          },
          decisionCheckpoints: {
            type: 'array',
            items: { $ref: '#/components/schemas/DecisionCheckpoint' },
          },
        },
      },
      EstimatedCost: {
        type: 'object',
        properties: {
          flights: { type: 'number', minimum: 0 },
          accommodation: { type: 'number', minimum: 0 },
          food: { type: 'number', minimum: 0 },
          activities: { type: 'number', minimum: 0 },
          localTransport: { type: 'number', minimum: 0 },
          contingency: { type: 'number', minimum: 0 },
          total: {
            type: 'number',
            minimum: 0,
            example: 1200,
          },
        },
      },
      DayPlan: {
        type: 'object',
        properties: {
          dayNumber: {
            type: 'integer',
            minimum: 1,
          },
          title: { type: 'string' },
          summary: { type: 'string' },
          dayStatus: {
            type: 'string',
            enum: ['draft', 'planned', 'confirmed', 'completed'],
          },
          activities: {
            type: 'array',
            items: { $ref: '#/components/schemas/Activity' },
          },
          weatherSnapshot: {
            $ref: '#/components/schemas/Weather',
          },
        },
      },
      Activity: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          locationName: { type: 'string' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          estimatedCost: { type: 'number', minimum: 0 },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          bookingRequired: { type: 'boolean' },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          reviewCount: { type: 'integer', minimum: 0 },
          notes: { type: 'string' },
          bookingOptions: {
            type: 'array',
            items: { $ref: '#/components/schemas/BookingOption' },
          },
        },
      },
      Weather: {
        type: 'object',
        properties: {
          forecastDate: { type: 'string', format: 'date-time' },
          temperatureCelsius: { type: 'number' },
          feelsLikeCelsius: { type: 'number' },
          humidity: { type: 'number', minimum: 0, maximum: 100 },
          windSpeed: { type: 'number', minimum: 0 },
          precipitationChance: { type: 'number', minimum: 0, maximum: 100 },
          weatherType: { type: 'string' },
          advisoryMessage: { type: 'string' },
          isOutdoorFriendly: { type: 'boolean' },
          source: { type: 'string' },
        },
      },
      HotelRecommendation: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tier: { type: 'string' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          nightlyRateEstimate: { type: 'number', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          rating: { type: 'number', minimum: 0, maximum: 5 },
          reviewCount: { type: 'integer', minimum: 0 },
          bookingOptions: {
            type: 'array',
            items: { $ref: '#/components/schemas/BookingOption' },
          },
        },
      },
      BookingOption: {
        type: 'object',
        properties: {
          providerName: { type: 'string' },
          providerType: { type: 'string' },
          bookingUrl: { type: 'string' },
          priceEstimate: { type: 'number', minimum: 0 },
          currency: { type: 'string', minLength: 3, maxLength: 3 },
          availabilityStatus: { type: 'string' },
        },
      },
      DecisionCheckpoint: {
        type: 'object',
        properties: {
          checkpointType: { type: 'string' },
          message: { type: 'string' },
          triggeredAt: { type: 'string', format: 'date-time' },
          userDecision: { type: 'string' },
          affectedDay: { type: 'integer', minimum: 1 },
        },
      },
      AddActivityRequest: {
        type: 'object',
        required: ['dayNumber', 'title', 'category', 'location', 'estimatedCost'],
        properties: {
          dayNumber: { type: 'integer', minimum: 1, example: 1 },
          title: { type: 'string', maxLength: 160, example: 'Sunrise hike to Dudhsagar Falls' },
          description: { type: 'string', maxLength: 500 },
          category: {
            type: 'string',
            enum: [
              'sightseeing',
              'museum',
              'food',
              'outdoor',
              'shopping',
              'transport',
              'entertainment',
              'wellness',
              'other',
            ],
          },
          location: { type: 'string', example: 'Dudhsagar Falls, Goa' },
          estimatedCost: { type: 'number', minimum: 0, example: 50 },
          startTime: { type: 'string', example: '06:00' },
          endTime: { type: 'string', example: '10:00' },
          bookingRequired: { type: 'boolean', default: false },
          notes: { type: 'string' },
          preferredTimeSlot: { type: 'string', example: 'morning' },
        },
      },
      UpdateActivityRequest: {
        type: 'object',
        minProperties: 1,
        description: 'All fields optional; at least one must be provided.',
        properties: {
          title: { type: 'string', maxLength: 160 },
          description: { type: 'string', maxLength: 500 },
          category: {
            type: 'string',
            enum: [
              'sightseeing',
              'museum',
              'food',
              'outdoor',
              'shopping',
              'transport',
              'entertainment',
              'wellness',
              'other',
            ],
          },
          location: { type: 'string' },
          estimatedCost: { type: 'number', minimum: 0 },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          bookingRequired: { type: 'boolean' },
          notes: { type: 'string' },
          preferredTimeSlot: { type: 'string' },
        },
      },
      RegenerateDayRequest: {
        type: 'object',
        required: ['regenerationIntent'],
        properties: {
          regenerationIntent: { type: 'string' },
          customPrompt: { type: 'string' },
        },
      },
      OptimizeTripRequest: {
        type: 'object',
        required: ['tripId', 'optimizationGoal'],
        properties: {
          tripId: { type: 'string' },
          optimizationGoal: {
            type: 'string',
            enum: [
              'reduce cost',
              'luxury upgrade',
              'family friendly',
              'less walking',
              'food focused',
              'fewer transitions',
            ],
          },
        },
      },
      CheckConflictsRequest: {
        type: 'object',
        required: ['tripId'],
        properties: {
          tripId: { type: 'string' },
        },
      },
      RecommendAlternativesRequest: {
        type: 'object',
        required: ['tripId', 'affectedDay', 'reason'],
        properties: {
          tripId: { type: 'string' },
          affectedDay: { type: 'integer', minimum: 1 },
          reason: {
            type: 'string',
            enum: [
              'bad weather',
              'attraction unavailable',
              'user preference change',
              'budget concern',
            ],
          },
        },
      },
    },
  },
};
