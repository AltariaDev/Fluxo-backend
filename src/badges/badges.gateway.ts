import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { BadgesService } from './badges.service';
import { Server, Socket } from 'socket.io';
import { Badge } from './entities/badge.entity';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards/ws-jwt-auth.guard';
import { differenceInMonths } from 'date-fns';

// Opcionalmente, puedes especificar un namespace o configuraciones
@WebSocketGateway({ cors: true, namespace: '/badges' })
export class BadgesGateway implements OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer()
  server: Server;

  constructor(private readonly badgesService: BadgesService) {}
  handleConnection(client: any, ...args: any[]) {
    throw new Error('Method not implemented.');
  }
  handleDisconnect(client: any) {
    throw new Error('Method not implemented.');
  }

  @UseGuards(WsJwtAuthGuard)
  notifyBadgeUnlocked(client: Socket, badge: Badge) {
    client.emit('badgeUnlocked', badge);
  }

  // /**
  //  * Ejemplo de hook al conectar un cliente
  //  */
  // @UseGuards(WsJwtAuthGuard)
  // handleConnection(@ConnectedSocket() client: Socket) {
  //   console.log(`Client connected: ${client.id}`);
  // }

  // /**
  //  * Ejemplo de hook al desconectar un cliente
  //  */
  // @UseGuards(WsJwtAuthGuard)
  // handleDisconnect(@ConnectedSocket() client: Socket) {
  //   console.log(`Client disconnected: ${client.id}`);
  // }
}

/*
mensajees directos
salas de chat
*/
