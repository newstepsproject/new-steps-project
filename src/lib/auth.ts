import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcrypt';
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
  }
  
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    }
  }
}

// Extend JWT to include our custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
    async jwt({ token, user }) {
      console.log('JWT callback - token:', token, 'user:', user);
      if (user) {
        // Handle both string ID and ObjectId
        if (user.id) {
          token.id = user.id;
        } else if (user._id) {
          token.id = typeof user._id === 'string' ? user._id : 
                    (user._id && typeof user._id.toString === 'function') ? 
                    user._id.toString() : '';
        }
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - session:', session, 'token:', token);
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
}; 