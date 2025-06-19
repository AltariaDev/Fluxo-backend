import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FrameDocument = Frame & Document;
@Schema({ timestamps: true, versionKey: false })
export class Frame extends Document {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: String })
  image: string;
}

export const FrameSchema = SchemaFactory.createForClass(Frame);