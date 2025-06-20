import { Document, Types } from 'mongoose';

export enum TimerStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  FINISHED = 'finished',
}

export interface BaseTimer extends Document {
  userId: Types.ObjectId;
  status: TimerStatus;
  name: string;
  description?: string;
  startedAt?: Date;
  pausedAt?: Date;
} 