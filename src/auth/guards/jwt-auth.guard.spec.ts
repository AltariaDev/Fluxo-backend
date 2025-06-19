import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface RequestWithUser extends Omit<Request, 'cookies'> {
  user?: JwtPayload;
  cookies?: { [key: string]: string };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    const mockGetRequest = jest.fn();
    const mockSwitchToHttp = jest.fn().mockReturnValue({ getRequest: mockGetRequest });
    
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should allow access to public routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should extract token from cookies', async () => {
      const mockToken = 'valid.token';
      const mockRequest = {
        cookies: {
          access_token: mockToken,
        },
        headers: {
          authorization: undefined,
        },
        user: undefined,
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.user).toEqual({ id: '1', email: 'test@example.com' });
    });

    it('should extract token from Authorization header', async () => {
      const mockToken = 'valid.token';
      const mockRequest = {
        cookies: {},
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
        user: undefined,
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
      expect(mockRequest.user).toEqual({ id: '1', email: 'test@example.com' });
    });

    it('should return false when no token is found', async () => {
      const mockRequest = {
        cookies: {},
        headers: {
          authorization: undefined,
        },
        user: undefined,
      };
      mockGetRequest.mockReturnValue(mockRequest);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return false when token verification fails', async () => {
      const mockToken = 'invalid.token';
      const mockRequest = {
        cookies: {
          access_token: mockToken,
        },
        headers: {
          authorization: undefined,
        },
        user: undefined,
      };
      mockGetRequest.mockReturnValue(mockRequest);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken);
    });
  });
}); 