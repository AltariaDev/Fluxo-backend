import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export class Conditions{
    @Prop({ type: String, required: true })
    condition: string; //enum

    @Prop({ type: Number, required: true })
    value: number;
}

export type QuestDocument = Quest & Document;
@Schema({ timestamps: true, versionKey: false })
export class Quest extends Document{

    @Prop({ required: true, type: String, unique: true })
    title: string;
    @Prop({ type: String, required: false })
    description?: string;
    @Prop({ type: String, required: true, default: '' })
    category: string;
    @Prop({ type: Number, required: true, default: 1 })
    level: number;
    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true })
    reward: mongoose.Types.ObjectId;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: false })
    badge?: mongoose.Types.ObjectId;
    @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Task', required: true })
    tasks: mongoose.Types.ObjectId[];
    @Prop({type: [Conditions], required: true })
    conditions: Conditions[];
}



export const QuestSchema = SchemaFactory.createForClass(Quest);