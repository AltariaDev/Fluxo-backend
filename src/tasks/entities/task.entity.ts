import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";


export enum TaskStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  PROGRESS = "progress",
  DROPPED = "dropped",
  REVISION = "revision",
}
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type TaskDocument = Task & Document;
@Schema({ timestamps: true, versionKey: false })
export class Task extends Document{

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({type: String, required: false, default: ""}) 
  description: string;

  @Prop({ required: true, enum: ["completed", "pending", "progress", "dropped", "revision"], default: "pending"}) 
  status: string;

  @Prop({ type: Date, required: false })
  startDate?: Date;

  @Prop({ type: Date, required: false })
  endDate?: Date;

  @Prop({ type: Date, required: false })
  dueDate?: Date;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: [String], default: [], required: false })
  tags: string[];

  @Prop({ required: false, enum: ["low", "medium", "high"] })
  priority?: string;

  @Prop({type: String, required: false, default: ''})
  category: string;

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: "Task", default: []  })
  subTasks: mongoose.Schema.Types.ObjectId[];

  @Prop({type: String, required: false, default: ''})
  color: string

  @Prop({type: [mongoose.Schema.Types.ObjectId], ref: "Pomodoro", default: []  })
  pomodoros: mongoose.Schema.Types.ObjectId[];

  @Prop({type: Date, required: false})
  completedAt: Date;

}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ userId: 1 });
TaskSchema.index({ startDate: 1 });
TaskSchema.index({ endDate: 1 });
TaskSchema.index({ userId: 1, startDate: 1 });
TaskSchema.index({ userId: 1, endDate: 1 });
TaskSchema.index({ status: 1 });
// TaskSchema.index({_id: 1});
TaskSchema.index({ category: 1, startDate: 1 });
TaskSchema.index({ priority: 1, startDate: 1 });
