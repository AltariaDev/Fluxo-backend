import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      fullname: 'Test User',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      const mockUser = { id: '1', ...createUserDto };
      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.register(createUserDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login and set cookies', async () => {
      const mockTokens = {
        access_token: 'access.token',
        refresh_token: 'refresh.token',
      };
      mockAuthService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(loginUserDto, mockResponse);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginUserDto);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        ...mockTokens,
      });
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      await expect(controller.login(loginUserDto, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh access token', async () => {
      const mockRequest = {
        cookies: {
          refresh_token: 'valid.refresh.token',
        },
      };
      const mockTokens = {
        access_token: 'new.access.token',
      };
      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refresh(mockRequest as any, mockResponse);

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockRequest.cookies.refresh_token);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Token refreshed successfully',
      });
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const mockRequest = {
        cookies: {},
      };

      await expect(controller.refresh(mockRequest as any, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const mockRequest = {
        cookies: {
          refresh_token: 'valid.refresh.token',
        },
      };
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest as any, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith(mockRequest.cookies.refresh_token, mockResponse);
      expect(result).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const mockRequest = {
        cookies: {},
      };

      await expect(controller.logout(mockRequest as any, mockResponse)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle logout errors', async () => {
      const mockRequest = {
        cookies: {
          refresh_token: 'invalid.token',
        },
      };
      mockAuthService.logout.mockRejectedValue(new UnauthorizedException());

      await expect(controller.logout(mockRequest as any, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    const requestPasswordResetDto = {
      email: 'test@example.com',
    };

    it('should successfully request password reset', async () => {
      const mockResponse = { message: 'Password reset code sent to your email' };
      mockAuthService.requestPasswordReset.mockResolvedValue(mockResponse);

      const result = await controller.requestPasswordReset(requestPasswordResetDto);

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(requestPasswordResetDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      resetCode: '123456',
      newPassword: 'newpassword123',
    };

    it('should successfully reset password', async () => {
      const mockResponse = { message: 'Password has been reset successfully' };
      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword('test@example.com', resetPasswordDto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com', resetPasswordDto);
      expect(result).toEqual(mockResponse);
    });
  });
}); 