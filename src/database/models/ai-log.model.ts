import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from 'mongoose';

const aiLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      index: true,
    },
    interactionType: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    rawResponse: {
      type: String,
      required: true,
    },
    parsedResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    fallbackTriggered: {
      type: Boolean,
      default: false,
    },
    tokenUsage: {
      promptTokens: {
        type: Number,
        min: 0,
        default: 0,
      },
      completionTokens: {
        type: Number,
        min: 0,
        default: 0,
      },
      totalTokens: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    latencyMs: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

export type AiLog = InferSchemaType<typeof aiLogSchema>;
export type AiLogDocument = HydratedDocument<AiLog>;

export const AiLogModel = model<AiLog>('AiLog', aiLogSchema);
