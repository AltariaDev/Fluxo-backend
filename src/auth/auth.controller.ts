import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Get,
  UseGuards,
  HttpCode,
  HttpException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { LoginUserDto } from "src/users/dto/login-user.dto";
import { Request, Response } from "express";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from "@nestjs/throttler";

// Define interface for request with user property
interface RequestWithUser extends Request {
  user?: any;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid data provided",
  })
  @Public()
  @Post("register")
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } = await this.authService.register(createUserDto);

    // Set cookies with proper configuration
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict",
      path: '/',
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict",
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { 
      success: true,
      message: "Registration successful",
      user,
      access_token,
      refresh_token
    };
  }

  @Public()
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post("login")
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      this.logger.debug('Login attempt for user');
      
      const { access_token, refresh_token } =
        await this.authService.login(loginUserDto);

      this.logger.debug('Setting cookies for login response');

      // Set cookies with proper configuration
      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: '/',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      this.logger.debug('Login successful, cookies set');

      return { 
        success: true,
        message: "Login successful",
        access_token,
        refresh_token
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @HttpCode(200)
  @Post("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      this.logger.debug('Refresh token request received');
      
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        this.logger.warn('No refresh token found in cookies');
        throw new UnauthorizedException("Refresh token missing");
      }

      const { access_token } = await this.authService.refreshToken(refreshToken);

      // Set cookie with same settings as login
      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: '/',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      this.logger.debug('Access token refreshed successfully');
      return { 
        success: true,
        message: "Token refreshed successfully" 
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Refresh token failed: ${error.message}`);
      throw new InternalServerErrorException('Error refreshing token');
    }
  }

  @Public()
  @HttpCode(200)
  @Post("logout")
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "User logged out successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized - Invalid or missing refresh token" })
  @ApiResponse({ status: 500, description: "Internal server error" })
  async logout(
    @Req() req: Request & { cookies: { refresh_token?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      this.logger.debug('Logout request received');
      this.logger.debug(`Cookies present: ${JSON.stringify(req.cookies)}`);

      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        this.logger.warn('Logout attempted without refresh token in cookies');
        throw new UnauthorizedException("No refresh token found");
      }

      this.logger.debug(`Refresh token found: ${refreshToken.substring(0, 10)}...`);
      await this.authService.logout(refreshToken, res);
      this.logger.debug('Logout completed successfully');

      return { 
        success: true,
        message: "Logged out successfully" 
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Logout failed: ${error.message}`);
      throw error;
    }
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiResponse({ status: 200, description: 'Reset code sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset code' })
  async resetPassword(
    @Body() dto: ResetPasswordDto
  ) {
    return this.authService.resetPassword( dto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // This endpoint will be handled by the Google strategy
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { access_token, refresh_token } = req.user;

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: '/',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.redirect('https://sherp-app.com');
    } catch (error) {
      this.logger.error(`Google callback error: ${error.message}`);
      throw error;
    }
  }
}