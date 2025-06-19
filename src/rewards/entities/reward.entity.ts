import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardType = 'badge' | 'quest' | 'streak' | 'other';

export type RewardDocument = Reward & Document;
@Schema({ timestamps: true, versionKey: false })
export class Reward extends Document {
  @Prop({ required: true })
  xp: number;
  
  @Prop({ required: true, enum: ['badge', 'quest', 'streak', 'other'] })
  type: RewardType;

  @Prop({type: Number, default: 0, required: false})
  coins?: number;

  @Prop({type: String, required: false, default: ''})
  title?: string;

  @Prop({type: String, required: false, default: ''})
  description?: string;

  @Prop({type: String, required: false, default: ''})
  banner?: string;

  @Prop({type: String, required: false, default: ''})
  frame?: string;

  @Prop({type: String, required: false, default: ''})
  avatar?: string;

  @Prop({type: Boolean, required: true, default: true})
  active: boolean;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
