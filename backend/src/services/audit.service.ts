import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    action: string,
    userId?: string,
    resourceType?: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          userId,
          resourceType,
          resourceId,
          ipAddress,
          userAgent,
          metadata,
        },
      });
      console.log(`📝 Audit log: ${action} by ${userId || 'anonymous'}`);
    } catch (error) {
      console.error('❌ Failed to create audit log:', error);
    }
  }

  async logSignup(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('USER_SIGNUP', userId, 'User', userId, ipAddress, userAgent, { email });
  }

  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('USER_LOGIN', userId, 'User', userId, ipAddress, userAgent);
  }

  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('LOGIN_FAILED', null, 'User', null, ipAddress, userAgent, { email });
  }

  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('USER_LOGOUT', userId, 'User', userId, ipAddress, userAgent);
  }

  async logPasswordReset(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('PASSWORD_RESET', userId, 'User', userId, ipAddress, userAgent);
  }

  async logPasswordChanged(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('PASSWORD_CHANGED', userId, 'User', userId, ipAddress, userAgent);
  }

  async logEmailVerified(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('EMAIL_VERIFIED', userId, 'User', userId, ipAddress, userAgent);
  }

  async logAccountLocked(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log('ACCOUNT_LOCKED', userId, 'User', userId, ipAddress, userAgent);
  }
}
