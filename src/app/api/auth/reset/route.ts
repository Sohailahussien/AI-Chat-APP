import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Clear all users and profiles
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    
    return NextResponse.json({
      success: true,
      message: 'Database reset successfully'
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}
