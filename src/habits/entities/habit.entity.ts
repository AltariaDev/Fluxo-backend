import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type HabitDocument = Habit & Document;
@Schema({ timestamps: true, versionKey: false })
export class Habit extends Document{
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String})
  description?: string;

  @Prop({ required: true, type: String })
  type: string;

  @Prop({ required: true, type: Boolean, default: false })
  status: boolean;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'] })
  frequency: string;

  @Prop({ type: [Date], default: [] })
  completedDates: Date[];

  @Prop({ type: Date, default: null, required: false })
  lastCompletedDate?: Date;
  
  @Prop({ type: Number, default: 0, required: false })
  bestStreak: number;

  @Prop({default: 0, required: false})
  streak: number;

  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Task' })
  taskId?: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
