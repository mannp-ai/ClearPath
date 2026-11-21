import mongoose, { Schema, Document } from 'mongoose';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: Role;
  status: 'active' | 'deactivated';
  emailVerified: boolean;
  profile: { name?: string };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER' },
  status: { type: String, enum: ['active', 'deactivated'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  profile: { name: String },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
