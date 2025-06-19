import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export type NoteDocument = Note & Document;

@Schema({ timestamps: true, versionKey: false })
export class Note {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  user: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Task", required: false })
  task?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Section", required: false })
  section?: mongoose.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: Boolean, default: false })
  isArchived: boolean;

  @Prop({ type: String, enum: ['text', 'markdown', 'code'], default: 'text' })
  format: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.index({ user: 1, title: 1 });
NoteSchema.index({ user: 1, task: 1 });
NoteSchema.index({ user: 1, section: 1 });
NoteSchema.index({ user: 1, tags: 1 });
