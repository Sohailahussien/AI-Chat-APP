# Email Verification Setup for Cubi AI

## Overview
Cubi AI now includes email verification functionality to ensure users verify their email addresses before accessing the application.

## Features
- ✅ **Email verification required** for new user registrations
- ✅ **Beautiful HTML email templates** with Cubi AI branding
- ✅ **24-hour token expiration** for security
- ✅ **Resend verification** functionality
- ✅ **Welcome email** sent after successful verification
- ✅ **Automatic login** after email verification

## Email Configuration

### Option 1: Gmail (Recommended for Development)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Update your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Option 2: Other Email Providers
Update your `.env.local` file with your provider's SMTP settings:

```env
# Email Configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

## How It Works

### 1. User Registration
- User fills out registration form
- Account is created with `emailVerified: false`
- Verification email is sent automatically
- User sees message: "Please check your email to verify your account"

### 2. Email Verification
- User clicks verification link in email
- Link contains a secure token that expires in 24 hours
- Account is marked as verified
- Welcome email is sent
- User is automatically logged in and redirected to the app

### 3. Login Protection
- Unverified users cannot log in
- They see: "Please verify your email address before logging in"
- Option to resend verification email

## API Endpoints

### POST `/api/auth/register`
- Creates unverified user account
- Sends verification email
- Returns `requiresVerification: true`

### GET/POST `/api/auth/verify-email?token=<token>`
- Verifies email using token
- Marks account as verified
- Sends welcome email
- Returns JWT token for automatic login

### POST `/api/auth/resend-verification`
- Generates new verification token
- Sends new verification email
- Useful if original email expired

### POST `/api/auth/login`
- Checks if email is verified
- Blocks unverified users
- Returns verification requirement message

## Database Schema Changes

The following fields were added to the User model:
```prisma
model User {
  // ... existing fields ...
  
  // Email verification
  emailVerified    Boolean   @default(false)
  emailVerifyToken String?
  emailVerifyExpires DateTime?
  
  // ... rest of model ...
}
```

## Frontend Changes

### AuthForm Component
- Updated to handle verification requirements
- Shows appropriate messages for unverified users
- Prevents login until email is verified

### New Verification Page
- Route: `/verify-email`
- Handles verification tokens from email links
- Shows success/error states
- Auto-redirects after successful verification

## Testing

### Development Mode
- If no SMTP credentials are configured, emails are logged to console
- Registration still works, but verification emails are simulated
- Check console for: "📧 Email would be sent (SMTP not configured)"

### Production Mode
- Configure SMTP settings in environment variables
- Real emails will be sent to users
- Monitor email delivery and bounce rates

## Security Features

- **Token expiration**: 24 hours
- **Cryptographically secure tokens**: 32-byte random hex strings
- **One-time use**: Tokens are cleared after verification
- **Rate limiting**: Consider implementing for resend endpoint
- **Email validation**: Ensures real email addresses

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP credentials in `.env.local`
   - Verify firewall/network settings
   - Check email provider's sending limits

2. **Verification links not working**
   - Ensure `NEXTAUTH_URL` is set correctly
   - Check if tokens are expiring too quickly
   - Verify database connection

3. **Users stuck in verification loop**
   - Check if `emailVerified` field is being updated
   - Verify JWT token generation
   - Check browser console for errors

### Debug Mode
Enable debug logging by adding to `.env.local`:
```env
DEBUG_EMAIL=true
```

## Next Steps

1. **Configure SMTP settings** in your environment
2. **Test the registration flow** with a real email
3. **Customize email templates** if needed
4. **Monitor email delivery** in production
5. **Consider adding rate limiting** for security

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your SMTP configuration
3. Test with a simple email client first
4. Check the database for user verification status
