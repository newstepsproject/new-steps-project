import { randomBytes } from 'crypto';
import connectToDatabase from '@/lib/db';
import PasswordResetToken from '@/models/password-reset-token';
import mongoose from 'mongoose';

// Token expiration time (1 hour)
const TOKEN_EXPIRATION = 60 * 60 * 1000;

/**
 * Generate a random token
 * @returns Random token string
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a password reset token for a user
 * @param userId - User ID
 * @returns The generated token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  await connectToDatabase();
  
  // Delete any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION);
  
  await PasswordResetToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    token,
    expires,
  });
  
  return token;
}

/**
 * Verify a password reset token
 * @param token - Reset token to verify
 * @returns User ID if token is valid, null otherwise
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  await connectToDatabase();
  
  const resetToken = await PasswordResetToken.findOne({ 
    token,
    expires: { $gt: new Date() }
  });
  
  if (!resetToken) {
    return null;
  }
  
  const userId = resetToken.userId.toString();
  
  // Delete the token to prevent reuse
  await PasswordResetToken.deleteOne({ _id: resetToken._id });
  
  return userId;
} 