import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RewardsService } from './rewards.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from 'src/auth/guards/ws-jwt-auth.guard';
import mongoose from 'mongoose';

@WebSocketGateway({ namespace: '/rewards' })
@UseGuards(WsJwtAuthGuard)
export class RewardsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * Permite al usuario reclamar una recompensa.
   * El mensaje recibido debe tener al menos la propiedad rewardId.
   */
  @SubscribeMessage('claimReward')
  async handleClaimReward(
    @MessageBody() data: { rewardId: mongoose.Types.ObjectId },
    @ConnectedSocket() client: Socket,
  ) {
    // Se asume que el guard asigna el payload a client.user
    const userId = (client as any).user?.id;
    if (!userId) {
      return { error: 'User not authenticated' };
    }

    // Llama al servicio para reclamar la reward y actualizar el perfil del usuario.
    const result = await this.rewardsService.claimReward(data.rewardId, userId);
    
    // Puedes notificar al usuario que reclamó la recompensa
    client.emit('rewardClaimed', result);
    
    // También podrías emitir un evento global, si es necesario:
    // this.server.emit('rewardClaimedGlobal', { userId, ...result });

    return result;
  }

  /**
   * Ejemplo de método para crear una reward mediante WebSocket.
   * Esto es opcional, si deseas permitir crear rewards vía WS.
   */
  // @SubscribeMessage('createReward')
  // async handleCreateReward(
  //   @MessageBody() createRewardDto: CreateRewardDto,
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   // Este método podría estar restringido a administradores, por ejemplo.
  //   const reward = await this.rewardsService.create(createRewardDto);
  //   client.emit('rewardCreated', reward);
  //   return reward;
  // }
}
