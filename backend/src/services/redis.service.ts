import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined in environment variables');
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('👋 Redis disconnected');
  }

  // Session management
  async setSession(userId: string, refreshToken: string, sessionData: any, ttl: number): Promise<void> {
    const sessionKey = `session:${userId}:${refreshToken}`;
    await this.client.setex(sessionKey, ttl, JSON.stringify(sessionData));
  }

  async getSession(userId: string, refreshToken: string): Promise<any> {
    const sessionKey = `session:${userId}:${refreshToken}`;
    const data = await this.client.get(sessionKey);
    return data ? JSON.parse(data) : null;
  }

  async getSessionByToken(refreshToken: string): Promise<any> {
    const keys = await this.client.keys(`session:*:${refreshToken}`);
    if (keys.length === 0) return null;

    const data = await this.client.get(keys[0]);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: string, refreshToken: string): Promise<void> {
    const sessionKey = `session:${userId}:${refreshToken}`;
    await this.client.del(sessionKey);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const keys = await this.client.keys(`session:${userId}:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  // Token blacklist
  async blacklistToken(token: string, ttl: number): Promise<void> {
    await this.client.setex(`blacklist:${token}`, ttl, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${token}`);
    return result !== null;
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttl: number): Promise<number> {
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, ttl);
    }
    return current;
  }

  async getRateLimit(key: string): Promise<number> {
    const result = await this.client.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  async resetRateLimit(key: string): Promise<void> {
    await this.client.del(key);
  }
}
