import mongoose, { Schema, Document } from 'mongoose';

export interface IScenario extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  strategy: 'baseline' | 'avalanche' | 'snowball';
  extraPayment: number;
  loanSnapshot: Array<{
    name: string;
    type: 'Federal' | 'Private' | 'Unknown';
    balance: number;
    interest_rate: number;
    minimum_payment: number;
  }>;
  results: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ScenarioSchema = new Schema<IScenario>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  strategy: { type: String, enum: ['baseline', 'avalanche', 'snowball'], required: true },
  extraPayment: { type: Number, default: 0, min: 0, max: 100000 },
  loanSnapshot: { type: Schema.Types.Mixed },
  results: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Scenario = mongoose.model<IScenario>('Scenario', ScenarioSchema);
