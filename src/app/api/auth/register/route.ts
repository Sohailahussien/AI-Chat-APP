import { NextRequest, NextResponse } from 'next/server';
import { createUnverifiedUser } from '@/lib/auth';
import { sendEmail, generateEmailVerificationHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create unverified user
    const result = await createUnverifiedUser(email, password, name);

    if (!result) {
      return NextResponse.json(
        { error: 'User already exists or creation failed' },
        { status: 400 }
      );
    }

    const { user, verificationToken } = result;

    // Send verification email
    const verificationUrl = `${request.nextUrl.origin}/verify-email?token=${verificationToken}`;
    const emailSent = await sendEmail({
      to: email,
      subject: 'Verify Your Email - Cubi AI',
      html: generateEmailVerificationHTML(name || 'User', verificationUrl)
    });

    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
      // Don't fail registration if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      requiresVerification: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 