import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenBlacklistService } from '../token-black-list/token-black-list.service';
import { EmailService } from '../email/email.service';
import { UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let tokenBlacklistService: TokenBlacklistService;
  let emailService: EmailService;
  let eventEmitter: EventEmitter2;

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByRefreshToken: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockTokenBlacklistService = {
    isBlacklisted: jest.fn(),
    addToBlacklist: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetCode: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    tokenBlacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
    emailService = module.get<EmailService>(EmailService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      fullname: 'Test User',
      password: 'Password123!',
    };

    it('should create a new user and send welcome email', async () => {
      const mockUser = { id: '1', ...createUserDto };
      mockUsersService.create.mockResolvedValue(mockUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.register(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.fullname,
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle errors during registration', async () => {
      mockUsersService.create.mockRejectedValue(new InternalServerErrorException('Database error'));

      await expect(service.register(createUserDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser = {
      _id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
    };

    it('should successfully login and return tokens', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.login(loginUserDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid.refresh.token';
    const mockPayload = { id: '1', email: 'test@example.com' };
    const mockUser = {
      _id: '1',
      email: 'test@example.com',
      refreshToken: mockRefreshToken,
    };

    it('should successfully refresh access token', async () => {
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new.access.token');

      const result = await service.refreshToken(mockRefreshToken);

      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(true);

      await expect(service.refreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const mockRefreshToken = 'valid.refresh.token';
    const mockUser = {
      _id: '1',
      email: 'test@example.com',
      refreshToken: mockRefreshToken,
    };

    it('should successfully logout user', async () => {
      mockUsersService.findOneByRefreshToken.mockResolvedValue(mockUser);
      mockTokenBlacklistService.addToBlacklist.mockResolvedValue(undefined);
      mockUsersService.update.mockResolvedValue(undefined);

      const mockResponse = {
        clearCookie: jest.fn(),
      };

      await service.logout(mockRefreshToken, mockResponse as any);

      expect(mockTokenBlacklistService.addToBlacklist).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUser._id.toString(), { refreshToken: null });
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockUsersService.findOneByRefreshToken.mockResolvedValue(null);

      const mockResponse = {
        clearCookie: jest.fn(),
      };

      await expect(service.logout(mockRefreshToken, mockResponse as any)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 