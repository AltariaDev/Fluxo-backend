import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export type SubscriptionDocument = Subscription & Document;
@Schema({ timestamps: true, versionKey: false })
export class Subscription extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: SubscriptionTier, default: SubscriptionTier.FREE })
  tier: SubscriptionTier;

  @Prop({ type: String })
  stripeCustomerId: string;

  @Prop({ type: String })
  stripeSubscriptionId: string;

  @Prop({ type: Date })
  currentPeriodStart: Date;

  @Prop({ type: Date })
  currentPeriodEnd: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  cancelAtPeriodEnd: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription); 