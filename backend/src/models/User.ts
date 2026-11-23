import mongoose, { Schema, Document } from 'mongoose';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type AuthProvider = 'local' | 'google';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  authProvider: AuthProvider;
  role: Role;
  status: 'active' | 'deactivated';
  emailVerified: boolean;
  sessionVersion: number;
  profile: { name?: string; picture?: string };
  preferences?: { country?: string; currency?: string };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: false },
  googleId: { type: String, sparse: true, unique: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER' },
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  sessionVersion: { type: Number, default: 0 },
  profile: {
    name: { type: String, trim: true },
    picture: { type: String, trim: true },
  },
  preferences: {
    country: { type: String, uppercase: true, match: /^[A-Z]{2}$/ },
    currency: { type: String, uppercase: true, match: /^[A-Z]{3}$/ },
  },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
