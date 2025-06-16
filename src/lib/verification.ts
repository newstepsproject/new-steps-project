import { randomBytes } from 'crypto';
import connectToDatabase from '@/lib/db';
import VerificationToken from '@/models/verification-token';
import UserModel from '@/models/user';
import { User } from '@/types/user';
import { sendEmail, EmailTemplate } from '@/lib/email';
import mongoose, { Document } from 'mongoose';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Generate a random token
 * @returns Random token string
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a verification token for a user
 * @param userId - User ID
 * @returns The generated token
 */
export async function createVerificationToken(userId: string): Promise<string> {
  await connectToDatabase();
  
  // Delete any existing tokens for this user
  await VerificationToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_EXPIRATION);
  
  await VerificationToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    token,
    expires,
  });
  
  return token;
}

/**
 * Send a verification email to a user
 * @param userId - User ID
 * @param email - User's email address
 * @param name - User's name
 */
export async function sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
  const token = await createVerificationToken(userId);
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  await sendEmail(
    email,
    EmailTemplate.EMAIL_VERIFICATION,
    {
      name,
      verificationUrl,
    }
  );
}

/**
 * Verify a token and mark the user's email as verified
 * @param token - Verification token
 * @returns Whether the verification was successful
 */
export async function verifyEmail(token: string): Promise<boolean> {
  await connectToDatabase();
  
  const verificationToken = await VerificationToken.findOne({ token });
  
  if (!verificationToken || verificationToken.expires < new Date()) {
    return false;
  }
  
  const user = await UserModel.findById(verificationToken.userId);
  
  if (!user) {
    return false;
  }
  
  // Mark the user's email as verified
  user.emailVerified = true;
  await user.save();
  
  // Delete the token
  await VerificationToken.deleteOne({ _id: verificationToken._id });
  
  return true;
}

/**
 * Resend a verification email to a user
 * @param email - User's email address
 * @returns Whether the email was sent successfully
 */
export async function resendVerificationEmail(email: string): Promise<boolean> {
  await connectToDatabase();
  
  const user = await UserModel.findOne({ email });
  
  if (!user) {
    return false;
  }
  
  if (user.emailVerified) {
    return false;
  }
  
  // We need to ensure these fields exist and handle the type properly
  if (!user._id || !user.email || !user.name) {
    console.error('User is missing required fields for verification email');
    return false;
  }
  
  // Now we know these fields exist in the User model
  const userId = user._id.toString();
  const userEmail = user.email;
  const userName = user.name;
  
  await sendVerificationEmail(userId, userEmail, userName);
  
  return true;
} 