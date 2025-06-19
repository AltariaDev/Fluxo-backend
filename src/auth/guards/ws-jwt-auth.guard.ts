import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Socket } from 'socket.io';

interface SocketWithUser extends Socket {
  user?: JwtPayload;
}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Obtenemos el cliente (por ejemplo, un socket de Socket.IO)
    const client = context.switchToWs().getClient();

    // Intentamos obtener el token desde el handshake.
    // Dependiendo de la configuración del cliente, puede venir en los headers o en la query string.
    let token: string =
      client.handshake.headers.authorization || client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    // Si el token viene en formato "Bearer <token>", extraemos solo la parte útil.
    if (token.startsWith('Bearer ')) {
      token = token.slice(7).trim();
    }

    try {
      // Verificamos el token. Si es válido, obtenemos el payload.
      const payload = this.jwtService.verify<JwtPayload>(token);
      // Puedes asignar el payload al objeto del cliente para tener acceso posterior.
      (client as SocketWithUser).user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token invalid or expired');
    }
  }
}
