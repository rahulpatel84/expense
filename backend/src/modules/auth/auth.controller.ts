import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body(ValidationPipe) signupDto: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const { accessToken, refreshToken, user } = await this.authService.signup(signupDto, ipAddress);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        accessToken,
        user,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto, ipAddress, userAgent);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;
    const refreshToken = req.cookies.refreshToken;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    if (refreshToken) {
      await this.authService.logout(userId, refreshToken, ipAddress, userAgent);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    const { accessToken, refreshToken } = await this.authService.refreshTokens(oldRefreshToken);

    // Set new refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken,
      },
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip;
    await this.authService.forgotPassword(forgotPasswordDto, ipAddress);

    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    await this.authService.resetPassword(resetPasswordDto, ipAddress, userAgent);

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string, @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    await this.authService.verifyEmail(token, ipAddress, userAgent);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Req() req: any) {
    const userId = req.user.id;
    const ipAddress = req.ip;
    await this.authService.resendVerification(userId, ipAddress);

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: any) {
    return {
      success: true,
      data: {
        user: req.user,
      },
    };
  }
}
