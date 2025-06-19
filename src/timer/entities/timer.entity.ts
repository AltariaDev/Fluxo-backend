import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export type TimerDocument = Timer & Document;

@Schema({ timestamps: true, versionKey: false })
export class Timer extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Task", required: false })
  task?: mongoose.Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  elapsedTime: number;

  @Prop({ type: Boolean, default: false })
  isRunning: boolean;
  
  @Prop({ type: Date })
  startTime?: Date;
  
  @Prop({ type: Date })
  endTime?: Date;
  
  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'completed' | 'cancelled';
  
  @Prop({ type: String, required: false })
  notes?: string;
}

export const TimerSchema = SchemaFactory.createForClass(Timer);