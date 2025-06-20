import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseTimer, TimerStatus } from '../../interfaces/timer.interface';

@Schema({ timestamps: true })
export class Stopwatch extends Document implements BaseTimer {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: TimerStatus, default: TimerStatus.STOPPED })
  status: TimerStatus;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  pausedAt?: Date;

  @Prop({ type: Number, default: 0 })
  elapsedTime: number; // in milliseconds

  @Prop({ type: Number, default: 0 })
  totalElapsedTime: number; // in milliseconds, accumulates across pauses
}

export const StopwatchSchema = SchemaFactory.createForClass(Stopwatch); 