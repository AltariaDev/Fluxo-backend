import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Injectable()
export class CombinedAuthThrottleGuard implements CanActivate {
  constructor(
    private readonly throttlerGuard: ThrottlerGuard,
    private readonly jwtGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const throttled = await this.throttlerGuard.canActivate(context);
    if (!throttled) return false;

    return this.jwtGuard.canActivate(context);
  }
}
