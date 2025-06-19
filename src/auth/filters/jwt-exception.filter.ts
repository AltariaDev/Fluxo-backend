import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { TokenExpiredException } from '../exceptions/token-expired.exception';

@Catch(UnauthorizedException, TokenExpiredException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException | TokenExpiredException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = exception instanceof TokenExpiredException 
      ? HttpStatus.UNAUTHORIZED 
      : HttpStatus.UNAUTHORIZED;

    const message = exception instanceof TokenExpiredException
      ? 'Token has expired'
      : exception.message;

    response
      .status(status)
      .json({
        statusCode: status,
        message,
        error: exception instanceof TokenExpiredException ? 'Token Expired' : 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
  }
} 