import {
  Schema,
  model,
  Types,
  type HydratedDocument,
  type InferSchemaType,
} from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

refreshTokenSchema.index({ userId: 1, tokenHash: 1 });

export type RefreshToken = InferSchemaType<typeof refreshTokenSchema> & {
  userId: Types.ObjectId;
};
export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

export const RefreshTokenModel = model<RefreshToken>(
  'RefreshToken',
  refreshTokenSchema,
);
