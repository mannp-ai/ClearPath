import mongoose, { Schema, Document } from 'mongoose';

export interface IScenario extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  strategy: string;
  extraPayment: number;
  loanSnapshot: any;
  results: any;
  createdAt: Date;
  updatedAt: Date;
}

const ScenarioSchema = new Schema<IScenario>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  strategy: { type: String, required: true },
  extraPayment: { type: Number, default: 0 },
  loanSnapshot: { type: Schema.Types.Mixed },
  results: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Scenario = mongoose.model<IScenario>('Scenario', ScenarioSchema);
