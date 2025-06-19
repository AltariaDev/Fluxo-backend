import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import mongoose from "mongoose";

export class Word {
  @Prop({ required: true })
  word: string;

  @Prop({ required: true })
  definition: string;

  @Prop()
  example?: string;
}

export type SharedUserDocument = SharedUser & Document;
@Schema()
export class SharedUser extends Document { 
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ["viewer", "editor"] }) // Tipos de permisos
  role: string;
}

export const SharedUserSchema = SchemaFactory.createForClass(SharedUser);

export type DictDocument = Dict & Document;
@Schema({ timestamps: true, versionKey: false })
export class Dict extends Document {
  @Prop({
    required: true,
    minlength: 3,
  })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  ownerId: mongoose.Types.ObjectId; // Propietario del diccionario

  @Prop({type: String, required: false, default: ""}) 
  description: string;

  @Prop({ required: false, default: false })
  public: boolean;

  @Prop({ type: [Word], default: [] })
  words: Word[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: [SharedUserSchema], default: [] })
  sharedWith: SharedUser[];

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const DictSchema = SchemaFactory.createForClass(Dict);
