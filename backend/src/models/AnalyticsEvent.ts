import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  type: string;
  metadata?: any;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String, required: true },
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
