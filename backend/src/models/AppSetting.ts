import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSetting extends Document {
  key: string;
  value: any;
  version: number;
  changedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AppSettingSchema = new Schema<IAppSetting>({
  key: { type: String, required: true },
  value: Schema.Types.Mixed,
  version: { type: Number, default: 1 },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

AppSettingSchema.index({ key: 1, version: -1 });

export const AppSetting = mongoose.model<IAppSetting>('AppSetting', AppSettingSchema);
