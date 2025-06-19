import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export enum RecurrenceFrequency {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval: number; // Every X weeks/days/months
  daysOfWeek?: DayOfWeek[]; // For weekly: which days
  endDate?: Date; // When to stop recurring
  maxOccurrences?: number; // Alternative to endDate
}

export type EventsCalendarDocument = EventsCalendar & Document;
@Schema({ timestamps: true, versionKey: false })
export class EventsCalendar {
  @Prop({ type: String, required: true, maxlength: 25 })
  title: string;

  @Prop({ type: String, required: false, maxlength: 100 })
  description?: string;

  @Prop({ type: String, required: false, maxlength: 50 })
  location?: string;

  @Prop({ type: String, required: true, maxlength: 25, default: "General" })
  category: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Number, required: false })
  duration?: number;

  @Prop({ type: Date, required: false })
  endDate?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: {
      frequency: { type: String, enum: Object.values(RecurrenceFrequency), default: RecurrenceFrequency.NONE },
      interval: { type: Number, default: 1 },
      daysOfWeek: [{ type: Number, enum: [1,2,3,4,5,6,7] }],
      endDate: { type: Date, required: false },
      maxOccurrences: { type: Number, required: false },
    },
    required: false,
  })
  recurrence?: RecurrencePattern;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "EventsCalendar", required: false })
  parentEventId?: mongoose.Types.ObjectId; // For recurring event instances

  @Prop({ type: Boolean, default: false })
  isRecurringInstance: boolean;

  @Prop({ type: String, required: false, default: '' })
  color?: string;
}

export const EventsCalendarSchema = SchemaFactory.createForClass(EventsCalendar);
EventsCalendarSchema.index({ userId: 1 });
EventsCalendarSchema.index({ startDate: 1 });
EventsCalendarSchema.index({ endDate: 1 });
EventsCalendarSchema.index({ userId: 1, startDate: 1 });
EventsCalendarSchema.index({ userId: 1, endDate: 1 });
EventsCalendarSchema.index({ category: 1 });
EventsCalendarSchema.index({ userId: 1, isRecurringInstance: 1 });
EventsCalendarSchema.index({ parentEventId: 1 });
EventsCalendarSchema.index({ 'recurrence.frequency': 1 });
// EventsCalendarSchema.index({_id: 1});