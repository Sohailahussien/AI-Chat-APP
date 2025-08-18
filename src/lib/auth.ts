import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
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
      name: user.name || undefined
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
      name: user.name || undefined
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