import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const userPreferencesSchema = new Schema(
  {
    travelStyle: {
      type: String,
      trim: true,
      default: '',
    },
    hotelTier: {
      type: String,
      trim: true,
      default: '',
    },
    preferredCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    dietaryPreferences: {
      type: [String],
      default: [],
    },
    activityPreferences: {
      type: [String],
      default: [],
    },
    avoidActivities: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const budgetLedgerSchema = new Schema(
  {
    totalBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    allocatedBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    spentBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    remainingBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    entries: {
      type: [
        {
          type: {
            type: String,
            enum: ['allocation', 'release', 'update'],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          description: {
            type: String,
            required: true,
            trim: true,
          },
          createdAt: {
            type: Date,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    preferences: {
      type: userPreferencesSchema,
      default: {},
    },
    budgetLedger: {
      type: budgetLedgerSchema,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel = model<User>('User', userSchema);
