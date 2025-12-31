import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      console.log('✅ SendGrid email service initialized');
    } else {
      console.warn('⚠️  SENDGRID_API_KEY not found - emails will be logged to console');
    }
  }

  private getFromEmail(): string {
    return this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@expenseai.com';
  }

  private getFromName(): string {
    return this.configService.get<string>('SENDGRID_FROM_NAME') || 'ExpenseAI Team';
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!apiKey) {
      // Log email to console in development
      console.log('\n📧 ===== EMAIL (Console Mode) =====');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${this.getFromName()} <${this.getFromEmail()}>`);
      console.log('-----------------------------------');
      console.log(html);
      console.log('===================================\n');
      return;
    }

    try {
      await sgMail.send({
        to,
        from: {
          email: this.getFromEmail(),
          name: this.getFromName(),
        },
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('❌ Email send failed:', error);
      // In development, log the email instead of throwing
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📧 ===== EMAIL (Fallback - SendGrid Error) =====');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('================================================\n');
        return; // Don't throw in development
      }
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ExpenseAI! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up! We're excited to have you on board.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${verificationLink}</p>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This link will expire in <strong>24 hours</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>ExpenseAI - Your Smart Expense Tracker</p>
            <p style="font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, 'Verify your email address', html);
  }

  async sendPasswordResetEmail(email: string, token: string, name: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password 🔐</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in <strong>1 hour</strong>.<br>
              If you didn't request this, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>ExpenseAI - Your Smart Expense Tracker</p>
            <p style="font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, 'Reset your ExpenseAI password', html);
  }

  async sendPasswordChangedEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .success { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully ✅</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <div class="success">
              Your password was changed successfully on ${new Date().toLocaleString()}.
            </div>
            <p><strong>If you made this change:</strong><br>No further action is needed. You can now log in with your new password.</p>
            <p><strong>If you didn't make this change:</strong><br>Please contact our support team immediately. Your account security may be compromised.</p>
          </div>
          <div class="footer">
            <p>ExpenseAI - Your Smart Expense Tracker</p>
            <p style="font-size: 12px;">This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, 'Your password was changed', html);
  }
}
