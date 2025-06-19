import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define the interface for the Stat entity
export type StatDocument = Stat & Document;
@Schema({ timestamps: true, versionKey: false }) // Adds createdAt and updatedAt fields
export class Stat extends Document {
  @Prop({ type: Number, default: 0 })
  usersOnline: number;

  @Prop({ type: Number, default: 0 })
  usersRegistered: number;

  @Prop({ type: Number, default: 0 })
  usersRegisteredUsingGoogle: number;
  
  @Prop({ type: Number, default: 0 })
  activeUsers: number;

  @Prop({ type: Number, default: 0 })
  DAU: number; // Daily Active Users

  @Prop({ type: Number, default: 0 })
  WAU: number; // Weekly Active Users

  @Prop({ type: Number, default: 0 })
  MAU: number; // Monthly Active Users

  @Prop({ type: Number, default: 0 })
  maxCurrentOnline: number;

  @Prop({ type: Date, default: 0 })
  MaxCurrentOnlineDate: Date;
  
  @Prop({ type: Number, default: 0 })
  totalPomodoros: number;

  @Prop({ type: Number, default: 0 })
  totalPomodoroTime: number; // Total time spent in pomodoros

  @Prop({ type: Number, default: 0 })
  totalTasks: number; // Total tasks created

  @Prop({ type: Number, default: 0 })
  totalTasksCompleted: number; // Total tasks completed

  @Prop({ type: Number, default: 0 })
  totalSyncCalendar: number; // Total users who synced their calendar

  @Prop({ type: Number, default: 0 })
  totalPaidUsers: number; // Total users who paid for the app

  @Prop({ type: Number, default: 0 })
  totalHabits: number;// Total habits created

  @Prop({ type: Number, default: 0 })
  totalHabitsCompleted: number; // Total habits completed

  @Prop({ type: Number, default: 0 })
  totalHabitsDeleted: number; // Total habits deleted

  @Prop({ type: Number, default: 0 })
  totalTasksDeleted: number; // Total tasks deleted

  // @Prop({ type: Number, default: 0 })
  // totalUsersNotUsingPomodoro: number; // Total users who have not used the pomodoro feature

  // @Prop({ type: Number, default: 0 })
  // totalUsersNotUsingTasks: number; // Total users who have not used the tasks feature

  // @Prop({ type: Number, default: 0 })
  // totalUsersNotUsingCalendar: number; // Total users who have not used the calendar feature

  // @Prop({ type: Number, default: 0 })
  // totalUsersNotUsingHabits: number; // Total users who have not used the habits feature

  @Prop({ type: Number, default: 0 })
  totalAbandonedUsers: number; // Total users who have not used the app in the last 7 days

  // @Prop({ type: Number, default: 0 })
  // totalTickestCreated: number; // Total tickets created

  // @Prop({ type: Number, default: 0 })
  // totalTickestSolved: number; // Total tickets solved

  // @Prop({ type: Number, default: 0 })
  // PromedioRating: number; // Average rating of the app

  // @Prop({ type: Number, default: 0 })
  // totalRating: number; // number of people who rated the app
  
  // @Prop({ type: Number, default: 0 })
  // totalReviews: number; // Total reviews of the app

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @Prop({ type: Number, default: 0 })
  totalTasksCalendar: number;
  
  @Prop({type: Number, default: 0})
  totalUsersDeleted: number; // Total users deleted
  
  
}

// Create and export the schema
export const StatSchema = SchemaFactory.createForClass(Stat);

StatSchema.index({}, { unique: true });