import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

export type RemindersDocument = Reminders & Document;
@Schema({ timestamps: true, versionKey: false })
export class Reminders extends Document {
    @Prop({ type: String, required: true }) 
    title: string;
    @Prop({type: String, required: false})
    description?: string;
    @Prop({type: Date, required: true})
    date: Date;
    @Prop({ type: String, enum: ['active', 'completed','cancelled'], default: 'active' })
    status: string;
    @Prop({type: Boolean, required: false})
    repeat: boolean;
    @Prop({type: String, enum: ['daily', 'weekly', 'monthly'], required: false})
    repeatInterval?: string;
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user: mongoose.Types.ObjectId;
}

export const RemindersSchema = SchemaFactory.createForClass(Reminders); 