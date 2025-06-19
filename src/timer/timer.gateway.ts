import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { TimerService } from './timer.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { UpdateTimerDto } from './dto/update-timer.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
  },
})
export class TimerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TimerGateway.name);
  private userSockets: Map<string, Socket[]> = new Map();

  constructor(private readonly timerService: TimerService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
    
    const userSockets = this.userSockets.get(userId) || [];
    userSockets.push(client);
    this.userSockets.set(userId, userSockets);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter(socket => socket.id !== client.id);
      this.userSockets.set(userId, updatedSockets);
      this.logger.log(`Client disconnected: ${client.id} for user: ${userId}`);
    }
  }

  @SubscribeMessage('startTimer')
  async handleStartTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() startTimerDto: StartTimerDto,
  ) {
    try {
      const userId = new Types.ObjectId(client.handshake.query.userId as string);
      const timer = await this.timerService.startTimer(startTimerDto, userId);
      this.emitToUser(userId.toString(), 'timerStarted', timer);
      return { success: true, timer };
    } catch (error) {
      this.logger.error(`Error starting timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('updateTimer')
  async handleUpdateTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timerId: string; updateData: UpdateTimerDto },
  ) {
    try {
      const userId = new Types.ObjectId(client.handshake.query.userId as string);
      const timer = await this.timerService.updateTimer(
        new Types.ObjectId(data.timerId),
        data.updateData,
        userId,
      );
      this.emitToUser(userId.toString(), 'timerUpdated', timer);
      return { success: true, timer };
    } catch (error) {
      this.logger.error(`Error updating timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('pauseTimer')
  async handlePauseTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() timerId: string,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      const timer = await this.timerService.pauseTimer(timerId);
      this.emitToUser(userId, 'timerPaused', timer);
      return { success: true, timer };
    } catch (error) {
      this.logger.error(`Error pausing timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('resumeTimer')
  async handleResumeTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() timerId: string,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      const timer = await this.timerService.resumeTimer(timerId);
      this.emitToUser(userId, 'timerResumed', timer);
      return { success: true, timer };
    } catch (error) {
      this.logger.error(`Error resuming timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('stopTimer')
  async handleStopTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timerId: string; notes?: string },
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      const timer = await this.timerService.stopTimer(data.timerId, data.notes);
      this.emitToUser(userId, 'timerStopped', timer);
      return { success: true, timer };
    } catch (error) {
      this.logger.error(`Error stopping timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('deleteTimer')
  async handleDeleteTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() timerId: string,
  ) {
    try {
      const userId = new Types.ObjectId(client.handshake.query.userId as string);
      await this.timerService.deleteTimer(new Types.ObjectId(timerId), userId);
      this.emitToUser(userId.toString(), 'timerDeleted', { timerId });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting timer: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getTimers')
  async handleGetTimers(@ConnectedSocket() client: Socket) {
    try {
      const userId = new Types.ObjectId(client.handshake.query.userId as string);
      const timers = await this.timerService.getTimers(userId);
      return { success: true, timers };
    } catch (error) {
      this.logger.error(`Error getting timers: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('getTimerStats')
  async handleGetTimerStats(@ConnectedSocket() client: Socket) {
    try {
      const userId = new Types.ObjectId(client.handshake.query.userId as string);
      const stats = await this.timerService.getTimerStats(userId);
      return { success: true, stats };
    } catch (error) {
      this.logger.error(`Error getting timer stats: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit(event, data);
      });
    }
  }
} 