import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT token management
export function generateJWT(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// User authentication
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// User registration
export async function createUser(email: string, password: string, name?: string): Promise<AuthUser | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return null; // User already exists
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {
            aiLanguage: 'en',
            aiStyle: 'professional',
            preferences: {}
          }
        }
      },
      include: { profile: true }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined
    };
  } catch (error) {
    console.error('User creation error:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: any): Promise<boolean> {
  try {
    await prisma.profile.update({
      where: { userId },
      data: profileData
    });
    return true;
  } catch (error) {
    console.error('Profile update error:', error);
    return false;
  }
}

// Email verification functions
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getEmailVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hours from now
  return expiry;
}

export async function createUnverifiedUser(
  email: string, 
  password: string, 
  name?: string
): Promise<{ user: AuthUser; verificationToken: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return null; // User already exists
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate verification token
    const verificationToken = generateEmailVerificationToken();
    const verificationExpiry = getEmailVerificationExpiry();

    // Create user with profile (unverified)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false,
        emailVerifyToken: verificationToken,
        emailVerifyExpires: verificationExpiry,
        profile: {
          create: {
            aiLanguage: 'en',
            aiStyle: 'professional',
            preferences: {}
          }
        }
      },
      include: { profile: true }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        emailVerified: user.emailVerified
      },
      verificationToken
    };
  } catch (error) {
    console.error('Unverified user creation error:', error);
    return null;
  }
}

export async function verifyEmailToken(token: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: {
          gt: new Date() // Token not expired
        }
      },
      include: { profile: true }
    });

    if (!user) {
      return null; // Invalid or expired token
    }

    // Update user as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null
      },
      include: { profile: true }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || undefined,
      emailVerified: updatedUser.emailVerified
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return null;
  }
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();
    const verificationExpiry = getEmailVerificationExpiry();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verificationToken,
        emailVerifyExpires: verificationExpiry
      }
    });

    return { success: true, message: 'Verification email sent' };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { success: false, message: 'Failed to resend verification email' };
  }
} 