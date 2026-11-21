import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'Federal' | 'Private' | 'Unknown';
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, enum: ['Federal', 'Private', 'Unknown'], default: 'Unknown' },
  balance: { type: Number, required: true, min: 0.01, max: 10000000 },
  interest_rate: { type: Number, required: true, min: 0, max: 100 },
  minimum_payment: { type: Number, required: true, min: 0.01, max: 1000000 },
}, { timestamps: true });

LoanSchema.index({ userId: 1, createdAt: 1 });

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
