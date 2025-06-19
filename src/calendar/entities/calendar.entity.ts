import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";


export type CalendarDocument = Calendar & Document;
@Schema({ timestamps: true, versionKey: false })
export class Calendar extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  user: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    default: [],
  })
  tasks: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "EventsCalendar" }],
    default: [],
  })
  events: mongoose.Types.ObjectId[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reminder" }],
    default: [],
  })
  reminders: mongoose.Types.ObjectId[];

  @Prop({
    type: Boolean,
    default: false,
    required: false
  })
  syncCalendar?: boolean;
}
export const CalendarSchema = SchemaFactory.createForClass(Calendar);
CalendarSchema.index({ user: 1 }, { unique: true });
