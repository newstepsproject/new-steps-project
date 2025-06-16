import { Document, Types } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export interface User {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  name?: string; // Keeping for backward compatibility
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Optional fields
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
  // OAuth related
  googleId?: string;
  emailVerified: boolean;
  // System fields
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  // References
  orders?: Types.ObjectId[];
  donations?: Types.ObjectId[];
}

export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
}

export interface SessionUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  image?: string;
} 