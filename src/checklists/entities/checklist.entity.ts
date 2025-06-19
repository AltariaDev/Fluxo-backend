import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ChecklistDocument = Checklist & Document;
@Schema({ timestamps: true, versionKey: false })
export class Checklist extends Document {

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: false, type: [mongoose.Schema.Types.ObjectId], ref: 'Task' })
  taskId?: mongoose.Types.ObjectId[];

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: mongoose.Types.ObjectId;
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);