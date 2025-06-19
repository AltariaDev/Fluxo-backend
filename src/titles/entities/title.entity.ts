import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TitleDocument = Title & Document;
@Schema({ timestamps: true, versionKey: false })
export class Title extends Document {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  description: string;
}

export const TitleSchema = SchemaFactory.createForClass(Title);