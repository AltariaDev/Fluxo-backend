import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";


export class eventLog{
  type: string;
  dateLog: Date;
  object?: mongoose.Types.ObjectId;
  value?: any;
}

export type UserLogDocument = UserLog & Document;
@Schema({ timestamps: true, versionKey: false })
export class UserLog extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  userId: mongoose.Types.ObjectId;
  @Prop({ type: Number, required: false, default: 0 })
  habitCounts: number;
  @Prop({ type: Number, required: false, default: 0 })
  taskCounts: number;
  // @Prop({ type: Number, required: false, default: 0 })
  // questCounts: number;
  // @Prop({ type: Number, required: false, default: 0 })
  // reminderCounts: number;
  // @Prop({ type: Number, required: false, default: 0 })
  // badgeCounts: number;
  @Prop({ type: [eventLog], required: true, default: []})
  logs: eventLog[];
  @Prop({ type: Date, required: false, default: new Date()})
  lastLogin: Date;
  @Prop({ type: [Date], required: false, default: []})
  loginDates: Date[]
  @Prop({ type: Date, required: false, default: new Date()})
  lastUpdate: Date;
  @Prop({ type: Date, required: false, default: new Date()})
  lastPasswordChange: Date;
  @Prop({ type: Date, required: false, default: new Date()})
  lastEmailChange: Date;
  @Prop({ type: Number, required: false, default: 0})
  loginCount: number;
  @Prop({ type: Number, required: false, default: 0})
  lastSessionDuration: number;
  // @Prop({ type: Number, required: false, default: 0})
  // PromedioSessionDuration: number;
  @Prop({ type: Number, required: false, default: 0})
  totalSessionDuration: number;
  @Prop({ type: Number, required: false, default: 0})
  totalProfileUpdate: number;
  @Prop({ type: Date, required: false, default: new Date()})
  lastProfileUpdate: Date;
  @Prop({ type: Date, required: false, default: new Date()})
  registerTime: Date;
  @Prop({ type: Number, required: false, default: 0})
  streak: number;
  @Prop({ type: Number, required: false, default: 0})
  bestStreak: number;
  @Prop({ type: Number, required: false, default: 0})
  taskDeleted: number;
  @Prop({ type: Number, required: false, default: 0})
  habitDeleted: number;
  @Prop({ type: Number, required: false, default: 0})
  pomodoroCreated: number;
  @Prop({ type: Number, required: false, default: 0})
  pomodoroStarted: number;
  @Prop({ type: Number, required: false, default: 0})
  pomodoroCompleted: number;
  @Prop({ type: Number, required: false, default: 0})
  pomodoroFinished: number; //terminados pero no completados
  @Prop({ type: Number, required: false, default: 0})
  taskCompleted: number;
  @Prop({ type: Number, required: false, default: 0})
  habitCompleted: number;
  @Prop({ type: Number, required: false, default: 0})
  taskCalendarCreated: number;
  @Prop({ type: Number, required: false, default: 0})
  EventsCalendarCreated: number;
  @Prop({ type: Number, required: false, default: 0})
  EventsCalendarDeleted: number;
  @Prop({ type: Number, required: false, default: 0})
  stopwatchCreated: number;
  @Prop({ type: Number, required: false, default: 0})
  stopwatchCompleted: number;
  @Prop({ type: Number, required: false, default: 0})
  countdownCreated: number;
  @Prop({ type: Number, required: false, default: 0})
  countdownCompleted: number;


}

export const UserLogSchema = SchemaFactory.createForClass(UserLog);
UserLogSchema.index({ userId: 1 }, { unique: true });