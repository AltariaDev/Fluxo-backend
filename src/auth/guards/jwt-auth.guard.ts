import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { RequestWithUser } from "../interfaces/request-with-user.interface";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { TokenExpiredException } from "../exceptions/token-expired.exception";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    // Try cookies first
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }

    // Then try Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug("🚀 Public route detected, allowing access");
      return true;
    }

    this.logger.debug("📌 JwtAuthGuard executing...");

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      this.logger.warn("❌ No token found in request");
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      this.logger.debug("🔑 JWT Payload:", payload);
      request.user = payload;
      return true;
    } catch (error) {
      this.logger.error(`❌ Token verification error (${error.message})`);
      
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }
      
      throw new UnauthorizedException("Invalid token");
    }
  }
}