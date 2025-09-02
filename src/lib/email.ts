import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Skip sending email if no SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Email would be sent (SMTP not configured):', {
        to: options.to,
        subject: options.subject
      });
      return true; // Return true for development
    }

    const mailOptions = {
      from: `"Cubi AI" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
}

export function generateEmailVerificationHTML(
  name: string,
  verificationUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Cubi AI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .content {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Cubi AI</div>
          <h1 class="title">Verify Your Email Address</h1>
        </div>
        
        <div class="content">
          <p>Hello ${name || 'there'},</p>
          
          <p>Thank you for signing up for Cubi AI! To complete your registration and start using our AI chat application, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${verificationUrl}
          </p>
          
          <div class="warning">
            <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
          </div>
          
          <p>Once verified, you'll be able to:</p>
          <ul>
            <li>Access your personalized AI chat interface</li>
            <li>Upload and analyze documents</li>
            <li>Save your chat history</li>
            <li>Use all features of Cubi AI</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>If you didn't create an account with Cubi AI, you can safely ignore this email.</p>
          <p>This email was sent from Cubi AI. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateWelcomeEmailHTML(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Cubi AI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background: white;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .content {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .feature {
          background-color: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 15px 0;
          border-radius: 0 6px 6px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Cubi AI</div>
          <h1 class="title">Welcome to Cubi AI! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Hello ${name || 'there'},</p>
          
          <p>Congratulations! Your email has been successfully verified and your Cubi AI account is now active.</p>
          
          <p>You can now enjoy all the features of our AI chat application:</p>
          
          <div class="feature">
            <strong>🤖 AI Chat Interface</strong><br>
            Chat with our advanced AI models for any questions or assistance you need.
          </div>
          
          <div class="feature">
            <strong>📄 Document Analysis</strong><br>
            Upload PDFs, Word documents, and other files for AI-powered analysis and insights.
          </div>
          
          <div class="feature">
            <strong>💾 Chat History</strong><br>
            Your conversations are automatically saved and can be accessed anytime.
          </div>
          
          <div class="feature">
            <strong>🌓 Dark/Light Mode</strong><br>
            Switch between themes for comfortable viewing in any environment.
          </div>
          
          <p>Ready to get started? Simply log in to your account and begin your first conversation!</p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Cubi AI. We're excited to be part of your AI journey!</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
