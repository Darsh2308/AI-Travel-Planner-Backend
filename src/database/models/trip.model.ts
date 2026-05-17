import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from 'mongoose';

const bookingOptionSchema = new Schema(
  {
    providerName: { type: String, trim: true, default: '' },
    providerType: { type: String, trim: true, default: '' },
    bookingUrl: { type: String, trim: true, default: '' },
    priceEstimate: { type: Number, min: 0, default: 0 },
    currency: {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    availabilityStatus: { type: String, trim: true, default: 'unknown' },
  },
  { _id: false },
);

const estimatedCostSchema = new Schema(
  {
    flights: { type: Number, min: 0, default: 0 },
    accommodation: { type: Number, min: 0, default: 0 },
    food: { type: Number, min: 0, default: 0 },
    activities: { type: Number, min: 0, default: 0 },
    localTransport: { type: Number, min: 0, default: 0 },
    contingency: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const activitySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    locationName: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    estimatedCost: { type: Number, min: 0, default: 0 },
    startTime: { type: String, trim: true, default: '' },
    endTime: { type: String, trim: true, default: '' },
    bookingRequired: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    notes: { type: String, trim: true, default: '' },
    bookingOptions: { type: [bookingOptionSchema], default: [] },
    amenities: { type: [String], default: [] },
  },
  { _id: true },
);

const weatherSnapshotSchema = new Schema(
  {
    forecastDate: { type: Date },
    temperatureCelsius: { type: Number },
    feelsLikeCelsius: { type: Number },
    humidity: { type: Number, min: 0, max: 100 },
    windSpeed: { type: Number, min: 0 },
    precipitationChance: { type: Number, min: 0, max: 100 },
    weatherType: { type: String, trim: true, default: '' },
    advisoryMessage: { type: String, trim: true, default: '' },
    isOutdoorFriendly: { type: Boolean, default: true },
    source: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const dayPlanSchema = new Schema(
  {
    dayNumber: { type: Number, required: true, min: 1 },
    title: { type: String, trim: true, default: '' },
    summary: { type: String, trim: true, default: '' },
    dayStatus: {
      type: String,
      enum: ['draft', 'planned', 'confirmed', 'completed'],
      default: 'draft',
    },
    activities: { type: [activitySchema], default: [] },
    weatherSnapshot: { type: weatherSnapshotSchema, default: {} },
  },
  { _id: false },
);

const hotelRecommendationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    tier: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    nightlyRateEstimate: { type: Number, min: 0, default: 0 },
    currency: {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    bookingOptions: { type: [bookingOptionSchema], default: [] },
  },
  { _id: true },
);

const decisionCheckpointSchema = new Schema(
  {
    checkpointType: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    triggeredAt: { type: Date, required: true, default: Date.now },
    userDecision: { type: String, trim: true, default: '' },
    affectedDay: { type: Number, min: 1 },
  },
  { _id: false },
);

const tripSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    destinationCity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    destinationCountry: { type: String, trim: true, maxlength: 160, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    totalDays: { type: Number, required: true, min: 1 },
    budgetTier: {
      type: String,
      required: true,
      enum: ['budget', 'standard', 'premium', 'luxury'],
    },
    allocatedBudgetAmount: { type: Number, min: 0, default: 0 },
    estimatedCost: { type: estimatedCostSchema, default: {} },
    tripStatus: {
      type: String,
      enum: [
        'draft',
        'planned',
        'weather_review_pending',
        'booked',
        'completed',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    itinerary: { type: [dayPlanSchema], default: [] },
    hotelRecommendations: { type: [hotelRecommendationSchema], default: [] },
    decisionCheckpoints: { type: [decisionCheckpointSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

tripSchema.index({ owner: 1, createdAt: -1 });

export type Trip = InferSchemaType<typeof tripSchema>;
export type TripDocument = HydratedDocument<Trip>;

export const TripModel = model<Trip>('Trip', tripSchema);
