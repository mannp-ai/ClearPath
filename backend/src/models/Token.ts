import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
}

function tokenModel(name: string) {
  const s = new Schema<IToken>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  }, { timestamps: true });
  s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return mongoose.model<IToken>(name, s);
}

export const EmailVerificationToken = tokenModel('EmailVerificationToken');
export const PasswordResetToken = tokenModel('PasswordResetToken');
