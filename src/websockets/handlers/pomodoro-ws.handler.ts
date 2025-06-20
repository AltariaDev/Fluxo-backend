// src/websockets/handlers/pomodoro-ws.handler.ts
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PomodoroService } from '../../pomodoro/pomodoro.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import mongoose from 'mongoose';
import { Pomodoro } from 'src/pomodoro/entities/pomodoro.entity';

@Injectable()
export class PomodoroWsHandler {
  private server: Server;
  private userSockets: Map<string, Set<string>> = new Map();
  private readonly logger = new Logger(PomodoroWsHandler.name);

  constructor(
    @Inject(forwardRef(() => PomodoroService)) private readonly pomodoroService: PomodoroService
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async onConnect(client: Socket, user: JwtPayload) {
    this.userSockets.set(user.id.toString(), new Set([client.id]));
    const pomodoro = await this.pomodoroService.findWorking(user.id);
    if (pomodoro) {
      for (const socketId of this.userSockets.get(user.id.toString()) || []) {
        this.server.to(socketId).emit('pomodoro found', pomodoro);
      }
    }
  }

  async handleJoin(data: { id: string }, client: Socket) {
    const user = (client as any).user;
    const pomodoro = await this.pomodoroService.findOne(
      new mongoose.Types.ObjectId(data.id),
      user.id
    );

    if (!pomodoro) {
      client.emit('error', 'Pomodoro not found');
      return;
    }

    client.join(data.id);
    this.logger.log(`💡 User ${user.id} joined room ${data.id}`);
    this.emitStatus(pomodoro);
  }

  async handleLeave(data: { id: string }, client: Socket) {
    const user = (client as any).user;
    client.leave(data.id);
    this.logger.log(`💡 User ${user.id} left room ${data.id}`);
  }

  emitStatus(pomodoro: Pomodoro) {
    this.server.to(pomodoro.id.toString()).emit('status', {
      _id: pomodoro.id,
      state: pomodoro.state,
      currentCycle: pomodoro.currentCycle,
      workDuration: pomodoro.workDuration,
      shortBreak: pomodoro.shortBreak,
      longBreak: pomodoro.longBreak,
      cycles: pomodoro.cycles,
      startAt: pomodoro.startAt,
      endAt: pomodoro.endAt,
      remainingTime: pomodoro.remainingTime,
      pausedState: pomodoro.pausedState,
      task: pomodoro.task
    });
  }
}
