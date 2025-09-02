import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { resendVerificationEmail } from '@/lib/auth';
import { sendEmail, generateEmailVerificationHTML } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Resend verification email
    const result = await resendVerificationEmail(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Get the user to send the new verification email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user && user.emailVerifyToken) {
      // Send the new verification email
      const verificationUrl = `${request.nextUrl.origin}/verify-email?token=${user.emailVerifyToken}`;
      const emailSent = await sendEmail({
        to: email,
        subject: 'Verify Your Email - Cubi AI',
        html: generateEmailVerificationHTML(user.name || 'User', verificationUrl)
      });

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
