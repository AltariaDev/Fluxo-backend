import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../auth/guards/ws-jwt-auth.guard';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User, UserDocument } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { BaseTimer } from './timer.interface';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({ 
  path: '/api/v0/timers/ws',
  cors: { 
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "https://sherp-app.com",
      "http://sherp-app.com",
      "http://develop.sherp-app.com",
      "https://develop.sherp-app.com"
    ],
    credentials: true,
    allowedHeaders: ['content-type', 'authorization']
  },
  transports: ['websocket']
})
export class TimerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TimerGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService
  ) {}

  afterInit(server: Server) {
    this.logger.log('Timer Gateway Initialized');
  }

  async handleConnection(client: Socket, @GetUser() user: UserDocument) {
    this.logger.log('Client connected');
    const raw = client.handshake.auth.token || client.handshake.headers.authorization;
    const token = raw?.replace(/^Bearer\s+/,'');
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).user = payload;
      this.logger.log(`✔️ Client ${client.id} connected as user ${payload.id}`);
      this.userSockets.set(payload.id.toString(), new Set([client.id]));
    } catch (error) {
      this.logger.error(error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log('Client disconnected');
  }

  @SubscribeMessage('join')
  async handleJoin(@MessageBody() data: {id: string, type: 'countdown' | 'stopwatch'}, @ConnectedSocket() client: Socket, @GetUser() user: User) {
    const {id, type} = data;
    this.logger.debug(`💡 User ${user.id} joined room ${type}:${id}`);
    client.join(`${type}:${id}`);
  }

  @SubscribeMessage('leave')
  async handleLeave(@MessageBody() data: {id: string, type: 'countdown' | 'stopwatch'}, @ConnectedSocket() client: Socket, @GetUser() user: User) {
    const {id, type} = data;
    client.leave(`${type}:${id}`);
    this.logger.log(`💡 User ${user.id} left room ${type}:${id}`);
  }

  emitStatus(timer: BaseTimer, type: 'countdown' | 'stopwatch') {
    this.server.to(`${type}:${timer._id}`).emit('status', timer);
  }
} 