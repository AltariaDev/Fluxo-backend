// src/websockets/app.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PomodoroWsHandler } from './handlers/pomodoro-ws.handler';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { User } from '../users/entities/user.entity';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({
  path: '/api/v0/ws',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:4000',
      'https://sherp-app.com',
      'http://sherp-app.com',
      'http://develop.sherp-app.com',
      'https://develop.sherp-app.com'
    ],
    credentials: true,
    allowedHeaders: ['content-type', 'authorization']
  },
  transports: ['websocket']
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly pomodoroHandler: PomodoroWsHandler
  ) {}

  afterInit(server: Server) {
    this.logger.log('Gateway initialized');
    this.pomodoroHandler.setServer(server);
  }

  async handleConnection(client: Socket) {
    const raw = client.handshake.auth.token || client.handshake.headers.authorization;
    const token = raw?.replace(/^Bearer\s+/, '');
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      (client as any).user = payload;
      this.logger.log(`✔️ Client ${client.id} connected as user ${payload.id}`);
      await this.pomodoroHandler.onConnect(client, payload);
    } catch (error) {
      this.logger.error(error);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('pomodoro:join')
  handleJoin(@MessageBody() data, @ConnectedSocket() client: Socket) {
    return this.pomodoroHandler.handleJoin(data, client);
  }

  @SubscribeMessage('pomodoro:leave')
  handleLeave(@MessageBody() data, @ConnectedSocket() client: Socket) {
    return this.pomodoroHandler.handleLeave(data, client);
  }
}
