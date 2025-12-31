import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../services/prisma.service';
import { RedisService } from '../../services/redis.service';
import { EmailService } from '../../services/email.service';
import { AuditService } from '../../services/audit.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private email: EmailService,
    private audit: AuditService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(signupDto: SignupDto, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { fullName, email, password, currencyCode } = signupDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        currencyCode: currencyCode || 'USD',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        currencyCode: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    // Generate verification token
    const verificationToken = this.generateToken();
    const tokenHash = await this.hashToken(verificationToken);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt: new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRY),
        ipAddress,
      },
    });

    // Send verification email
    await this.email.sendVerificationEmail(user.email, verificationToken, user.fullName);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateToken();

    // Create session
    await this.createSession(user.id, refreshToken);

    // Audit log
    await this.audit.logSignup(user.id, user.email, ipAddress);

    console.log(`✅ User signed up: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await this.audit.logFailedLogin(email, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account is locked. Please try again in ${remainingMinutes} minutes.`);
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.incrementFailedAttempts(user.id, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateToken();

    // Create session
    await this.createSession(user.id, refreshToken, ipAddress, userAgent);

    // Audit log
    await this.audit.logLogin(user.id, ipAddress, userAgent);

    console.log(`✅ User logged in: ${user.email}`);

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: {
        id: userWithoutPassword.id,
        fullName: userWithoutPassword.fullName,
        email: userWithoutPassword.email,
        avatarUrl: userWithoutPassword.avatarUrl,
        currencyCode: userWithoutPassword.currencyCode,
        emailVerified: userWithoutPassword.emailVerified,
        onboardingCompleted: userWithoutPassword.onboardingCompleted,
      },
    };
  }

  async logout(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Delete session from Redis
    await this.redis.deleteSession(userId, refreshToken);

    // Audit log
    await this.audit.logLogout(userId, ipAddress, userAgent);

    console.log(`✅ User logged out: ${userId}`);
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Validate refresh token
    const session = await this.redis.getSessionByToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        currencyCode: true,
        emailVerified: true,
        onboardingCompleted: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateToken();

    // Delete old session and create new one
    await this.redis.deleteSession(user.id, refreshToken);
    await this.createSession(user.id, newRefreshToken, session.ipAddress, session.userAgent);

    console.log(`✅ Tokens refreshed for user: ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, ipAddress?: string): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists
    if (!user) {
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const tokenHash = await this.hashToken(resetToken);

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.RESET_TOKEN_EXPIRY),
        ipAddress,
      },
    });

    // Send reset email
    await this.email.sendPasswordResetEmail(user.email, resetToken, user.fullName);

    console.log(`✅ Password reset email sent to: ${user.email}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, ipAddress?: string, userAgent?: string): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    const tokenHash = await this.hashToken(token);

    // Find valid reset token
    const passwordReset = await this.prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: passwordReset.userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedUntil: null,
      },
    });

    // Mark token as used
    await this.prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions
    await this.redis.deleteAllUserSessions(passwordReset.userId);

    // Send confirmation email
    await this.email.sendPasswordChangedEmail(passwordReset.user.email, passwordReset.user.fullName);

    // Audit log
    await this.audit.logPasswordChanged(passwordReset.userId, ipAddress, userAgent);

    console.log(`✅ Password reset for user: ${passwordReset.user.email}`);
  }

  async verifyEmail(token: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const tokenHash = await this.hashToken(token);

    // Find valid verification token
    const emailVerification = await this.prisma.emailVerification.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        verifiedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!emailVerification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: emailVerification.userId },
      data: { emailVerified: true },
    });

    // Mark verification as complete
    await this.prisma.emailVerification.update({
      where: { id: emailVerification.id },
      data: { verifiedAt: new Date() },
    });

    // Audit log
    await this.audit.logEmailVerified(emailVerification.userId, ipAddress, userAgent);

    console.log(`✅ Email verified for user: ${emailVerification.user.email}`);
  }

  async resendVerification(userId: string, ipAddress?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateToken();
    const tokenHash = await this.hashToken(verificationToken);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt: new Date(Date.now() + this.VERIFICATION_TOKEN_EXPIRY),
        ipAddress,
      },
    });

    // Send verification email
    await this.email.sendVerificationEmail(user.email, verificationToken, user.fullName);

    console.log(`✅ Verification email resent to: ${user.email}`);
  }

  // Helper methods
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };

    return this.jwt.sign(payload);
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async createSession(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const sessionData = {
      userId,
      refreshToken,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
    };

    await this.redis.setSession(userId, refreshToken, sessionData, this.REFRESH_TOKEN_EXPIRY);
  }

  private async incrementFailedAttempts(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const newFailedAttempts = user.failedLoginAttempts + 1;

    if (newFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
      // Lock account
      const lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
          lockedUntil,
        },
      });

      await this.audit.logAccountLocked(userId, ipAddress, userAgent);

      console.log(`⚠️  Account locked due to failed login attempts: ${user.email}`);
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lastFailedLoginAt: new Date(),
        },
      });

      await this.audit.logFailedLogin(user.email, ipAddress, userAgent);
    }
  }
}
