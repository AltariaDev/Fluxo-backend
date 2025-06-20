import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseTimer, TimerStatus } from '../../interfaces/timer.interface';

// export enum CountdownSeverity {
//   LOW = 'low',
//   MEDIUM = 'medium',
//   HIGH = 'high',
//   CRITICAL = 'critical'
// }

@Schema({ timestamps: true })
export class Countdown extends Document implements BaseTimer {
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

  @Prop({ required: false, enum: TimerStatus, default: null })
  pausedState?: TimerStatus;

  @Prop({ required: false, type: Number, default: null })
  interruptions: number;

  @Prop({ required: true, type: Number })
  duration: number; // in milliseconds

  @Prop({ type: Number, default: 0 })
  remainingTime: number; // in milliseconds

  // @Prop({ required: true, enum: CountdownSeverity, default: CountdownSeverity.MEDIUM })
  // severity: CountdownSeverity;
  
}

export const CountdownSchema = SchemaFactory.createForClass(Countdown); 