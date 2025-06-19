// src/pomodoro/pomodoro.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';


export enum PomodoroState {
  IDLE = 'idle',
  WORKING = 'working',
  PAUSED = 'paused',
  SHORT_BREAK = 'shortBreak',
  LONG_BREAK = 'longBreak',
  COMPLETED = 'completed',
  FINISHED = 'finished',
}

export type PomodoroDocument = Pomodoro & Document;
@Schema({ versionKey: false })
export class Pomodoro extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: Date, required: false })
  startAt: Date;

  @Prop({ type: Date, required: false })
  endAt: Date;

  @Prop({ type: Number, required: true, default: 25*60 })
  workDuration: number;

  @Prop({ type: Number, required: true, default: 5*60 })
  shortBreak: number;

  @Prop({ type: Number, required: true, default: 15*60 })
  longBreak: number;

  @Prop({ type: Number, required: true, default: 4 })
  cycles: number;

  @Prop({ type: Number, required: false, default: 0 })
  currentCycle: number;

  @Prop({
    type: String,
    enum: PomodoroState,
    default: PomodoroState.IDLE,
  })
  state: PomodoroState;

  @Prop({ type: Boolean, default: false })
  isShared: boolean;

  @Prop({ type: String })
  shareCode: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  sharedWith: mongoose.Types.ObjectId[];
  
  @Prop({ type: Number, default: 0, required: false})
  interruptions: number;

  @Prop({ type: Number, default: null, required: false})
  remainingTime?: number;

  @Prop({
    type: String,
    enum: PomodoroState,
    default: null,
  })
  pausedState?: PomodoroState;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false, default: null })
  task?: mongoose.Types.ObjectId;

  @Prop({ type: Date, default: null, required: false})
  lastResumedAt?: Date;
}

export const PomodoroSchema = SchemaFactory.createForClass(Pomodoro);
