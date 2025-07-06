import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import connectToDatabase from './db';
import UserModel from '@/models/user';
import type { UserDocument } from '@/types/user';
import { Types } from 'mongoose';
import { JWT } from 'next-auth/jwt';

// Extend the User type to include our custom fields
declare module 'next-auth' {
  interface User {
    _id?: unknown;
    role?: string;
    emailVerified?: boolean;
  }
  
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      emailVerified?: boolean;
    }
  }
}

// Extend JWT to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    emailVerified?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'test_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test_client_secret',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('No credentials provided');
          return null;
        }

        await connectToDatabase();
        
        // Find user by email
        const user = await UserModel.findOne({ 
          email: credentials.email.toLowerCase() 
        }).select('+password');

        console.log('User found in DB:', user);

        if (!user || !user.password) {
          console.log('User not found or no password');
          return null;
        }

        // Compare passwords
        const isPasswordValid = await compare(credentials.password, user.password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          return null;
        }

        // Return user without password for session
        const userWithoutPassword: Partial<UserDocument> = {
          // Handle _id safely
          _id: user._id instanceof Types.ObjectId 
               ? user._id 
               : typeof user._id === 'string' 
                 ? new Types.ObjectId(user._id) 
                 : user._id && typeof user._id.toString === 'function' 
                   ? new Types.ObjectId(user._id.toString())
                   : undefined,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        };

        console.log('Returning user for session:', userWithoutPassword);
        return userWithoutPassword as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('SignIn callback triggered:', { user, account, profile });
      
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          await connectToDatabase();
          
          // Check if user already exists
          const existingUser = await UserModel.findOne({ 
            email: user.email?.toLowerCase() 
          });
          
          if (existingUser) {
            console.log('Google user already exists:', existingUser.email);
            // Update user info from Google if needed
            await UserModel.findByIdAndUpdate(existingUser._id, {
              name: user.name,
              image: user.image,
              emailVerified: true, // Google accounts are pre-verified
              lastLogin: new Date()
            });
            return true;
          } else {
            // Create new user for Google OAuth
            console.log('Creating new Google user:', user.email);
            const newUser = await UserModel.create({
              email: user.email?.toLowerCase(),
              name: user.name,
              image: user.image,
              role: 'user', // Default role for new users
              emailVerified: true, // Google accounts are pre-verified
              password: null, // No password for OAuth users
              createdAt: new Date(),
              lastLogin: new Date()
            });
            
            console.log('New Google user created:', newUser._id);
            return true;
          }
        } catch (error) {
          console.error('Error in Google signIn callback:', error);
          return false;
        }
      }
      
      // Allow credentials provider
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback - token:', token, 'user:', user, 'account:', account);
      
      // Handle both credentials and OAuth sign-in
      if (user) {
        // If it's Google OAuth, we need to fetch the user from DB to get the MongoDB _id
        if (account?.provider === 'google') {
          try {
            await connectToDatabase();
            const dbUser = await UserModel.findOne({ 
              email: user.email?.toLowerCase() 
            });
            
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
              token.emailVerified = dbUser.emailVerified;
            }
          } catch (error) {
            console.error('Error fetching Google user from DB:', error);
          }
        } else {
          // Handle credentials login
          if (user.id) {
            token.id = user.id;
          } else if (user._id) {
            token.id = typeof user._id === 'string' ? user._id : 
                      (user._id && typeof user._id.toString === 'function') ? 
                      user._id.toString() : '';
          }
          token.role = user.role;
          token.emailVerified = user.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
}; 