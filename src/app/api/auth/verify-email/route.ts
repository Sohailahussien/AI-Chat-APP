import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, generateJWT } from '@/lib/auth';
import { sendEmail, generateWelcomeEmailHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the email token
    const user = await verifyEmailToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Generate JWT token for the verified user
    const jwtToken = generateJWT({
      userId: user.id,
      email: user.email
    });

    // Send welcome email
    const welcomeEmailSent = await sendEmail({
      to: user.email,
      subject: 'Welcome to Cubi AI! 🎉',
      html: generateWelcomeEmailHTML(user.name || 'User')
    });

    if (!welcomeEmailSent) {
      console.error('Failed to send welcome email to:', user.email);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to Cubi AI.',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify the email token
    const user = await verifyEmailToken(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Generate JWT token for the verified user
    const jwtToken = generateJWT({
      userId: user.id,
      email: user.email
    });

    // Send welcome email
    const welcomeEmailSent = await sendEmail({
      to: user.email,
      subject: 'Welcome to Cubi AI! 🎉',
      html: generateWelcomeEmailHTML(user.name || 'User')
    });

    if (!welcomeEmailSent) {
      console.error('Failed to send welcome email to:', user.email);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to Cubi AI.',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
