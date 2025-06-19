import { Injectable, UnauthorizedException, InternalServerErrorException, NotFoundException, Inject, HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { CreateUserDto } from "src/users/dto/create-user.dto";
import { LoginUserDto } from "src/users/dto/login-user.dto";
import { Response } from "express";
import * as argon2 from "argon2";
import * as sanitizeHtml from "sanitize-html";
import { TokenBlacklistService } from "../token-black-list/token-black-list.service";
import { Logger } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import * as crypto from 'crypto';
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventsList } from "src/events/list.events";
import { DiscordWebhookService } from "../webhooks/discord-webhook.service";
import { GoogleUser } from './interfaces/google-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private resetCodes = new Map<string, { code: string; expires: Date }>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly emailService: EmailService,
    private readonly discordWebhookService: DiscordWebhookService,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try{
      const user = await this.usersService.create(createUserDto);
      await this.emailService.sendWelcomeEmail(user.email, user.fullname);
      
      // Send Discord notification
      await this.discordWebhookService.notifyNewUser(user.username, user.email);
      
      // Generate tokens
      const payload = { id: user._id.toString(), email: user.email };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "12h" });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

      // Store the refresh token in the database
      await this.usersService.update(user._id.toString(), {
        refreshToken: refreshToken,
      });

      this.eventEmitter.emit(EventsList.USER_LOGGED_IN, {userId: user._id.toString()});
      
      return {
        user,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Register error: ${error.message}`);
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    try {
      this.logger.debug('Login attempt');
      
      loginUserDto.email = sanitizeHtml(loginUserDto.email);
      const { email, password } = loginUserDto;
      const user = await this.usersService.findOne(email);

      if (!user) {
        this.logger.warn(`Login failed: User not found - ${email}`);
        throw new UnauthorizedException("Invalid credentials");
      }

      const isValid = await argon2.verify(user.password, password);
      if (!isValid) {
        this.logger.warn(`Login failed: Invalid password for user - ${email}`);
        throw new UnauthorizedException("Invalid credentials");
      }

      // Use consistent payload structure
      const payload = { id: user._id.toString(), email: user.email };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "12h" });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

      // Store the unhashed refresh token in the database
      await this.usersService.update(user._id.toString(), {
        refreshToken: refreshToken,
      });

      this.logger.debug(`Login successful for user: ${email}`);
      this.eventEmitter.emit(EventsList.USER_LOGGED_IN, {userId: user._id.toString()});
      
      // Send Discord notification
      await this.discordWebhookService.notifyUserLogin(user.username);
      if (user.isDeleted){
        await this.usersService.update(user._id.toString(), {
          isDeleted: false,
          deletedAt: null,
        });

        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          message: "User has been restored"
        }
      }
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        message: "Login successful"
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      this.logger.debug('Refresh token attempt');

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        this.logger.warn('Refresh token is blacklisted');
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify the refresh token
      let payload;
      try {
        payload = this.jwtService.verify(refreshToken);
      } catch (error) {
        this.logger.warn(`Invalid refresh token: ${error.message}`);
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Find user by email from token
      const user = await this.usersService.findOne(payload.email);
      if (!user) {
        this.logger.warn(`User not found for refresh token: ${payload.email}`);
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Verify the refresh token matches the one stored in the database
      if (user.refreshToken !== refreshToken) {
        this.logger.warn('Refresh token mismatch with stored token');
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new access token with consistent payload structure
      const newAccessToken = this.jwtService.sign(
        { id: user._id, email: user.email },
        { expiresIn: "12h" }
      );

      this.logger.debug(`New access token generated for user: ${user.email}`);
      return { access_token: newAccessToken };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log("REFRESH TOKEN ERROR:", error);
      this.logger.error(`Refresh token error: ${error.message}`);
      throw error instanceof UnauthorizedException 
        ? error 
        : new InternalServerErrorException('Error refreshing token');
    }
  }

  async logout(refreshToken: string, res: Response): Promise<void> {
    try {
      this.logger.debug(`Logout attempt with refresh token: ${refreshToken.substring(0, 10)}...`);

      if (!refreshToken) {
        this.logger.warn('Logout attempted without refresh token');
        throw new UnauthorizedException('Refresh token is required');
      }

      const user = await this.usersService.findOneByRefreshToken(refreshToken);

      if (!user) {
        this.logger.warn('Invalid refresh token used for logout');
        throw new UnauthorizedException('Invalid refresh token');
      }

      this.logger.debug(`User ${user.email} logging out`);

      // Add the refreshToken to the blacklist
      await this.tokenBlacklistService.addToBlacklist(refreshToken);
      this.logger.debug('Refresh token added to blacklist');

      // Remove the refreshToken from the database
      await this.usersService.update(user._id.toString(), { refreshToken: null });
      this.logger.debug('Refresh token removed from user record');

      // Send Discord notification
      await this.discordWebhookService.notifyUserLogout(user.username);

      // Clear cookies with matching settings
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
         // 12 hours
      });
      
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
       // 7 days
      });

      this.logger.debug('Cookies cleared successfully');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Logout failed: ${error.message}`);
      throw error instanceof UnauthorizedException 
        ? error 
        : new InternalServerErrorException('Error during logout');
    }
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    try {
      const user = await this.usersService.findOne(dto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Generate a random 6-digit code
      const resetCode = crypto.randomInt(100000, 999999).toString();
      
      // Store the code with 15-minute expiration
      this.resetCodes.set(dto.email, {
        code: resetCode,
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });

      // Send the code via email
      await this.emailService.sendPasswordResetCode(dto.email, resetCode);

      return { message: 'Password reset code sent to your email' };
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const resetData = this.resetCodes.get(dto.email);
      
      if (!resetData) {
        throw new UnauthorizedException('No reset code found');
      }

      if (new Date() > resetData.expires) {
        this.resetCodes.delete(dto.email);
        throw new UnauthorizedException('Reset code has expired');
      }

      if (resetData.code !== dto.resetCode) {
        throw new UnauthorizedException('Invalid reset code');
      }

      // Hash the new password
      const hashedPassword = await argon2.hash(dto.newPassword);
      
      // Update the password
      await this.usersService.updatePassword(dto.email, hashedPassword);
      
      // Clear the reset code
      this.resetCodes.delete(dto.email);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  async validateGoogleUser(googleUser: GoogleUser) {
    try {
      let user = await this.usersService.findOne(googleUser.email);
      
      if (!user) {
        // Create new user if doesn't exist
        const createUserDto = {
          email: googleUser.email,
          username: googleUser.username,
          fullname: googleUser.fullname,
          password: crypto.randomBytes(32).toString('hex'), // Random password for Google users
          //avatar: googleUser.avatar,
          googleId: googleUser.googleId,
        };
        user = await this.usersService.create(createUserDto);
        await this.emailService.sendWelcomeEmail(user.email, user.fullname);
        await this.discordWebhookService.notifyNewUser(user.username, user.email, true);
      } else if (!user.googleId) {
        // Link Google account to existing user
        await this.usersService.update(user._id.toString(), {
          googleId: googleUser.googleId,
          //avatar: googleUser.avatar,
        });
      }

      const payload = { id: user._id.toString(), email: user.email };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "12h" });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

      await this.usersService.update(user._id.toString(), {
        refreshToken: refreshToken,
      });

      this.eventEmitter.emit(EventsList.USER_REGISTERED_GOOGLE, {userId: user.id});
      this.eventEmitter.emit(EventsList.USER_LOGGED_IN, {userId: user._id.toString()});
      await this.discordWebhookService.notifyUserLogin(user.username);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      this.logger.error(`Google validation error: ${error.message}`);
      throw error;
    }
  }
}