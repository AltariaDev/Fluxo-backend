import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
// import { Profile, ProfileSchema } from "./profile.entity";

// export class Profile {
//   @Prop({ default: "" })
//   bio: string;
//   @Prop({ default: "" })
//   avatar: string;
//   //settings: Record<string, any>;
// }

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export type UserDocument = User & Document;
@Schema({ timestamps: true, versionKey: false })
export class User extends Document {
  @Prop({
    required: true,
    minlength: 3,
  })
  fullname: string;

  @Prop({
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 128, // Revisar
  })
  username: string;

  @Prop({
    required: true,
    minlength: 8,
  })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ required: false, default: null, type: Date })
  birthDate: Date;

  @Prop({ required: false, default: null, type: Number})
  phoneNumber: number;

  // @Prop({ default: 0 })
  // xp: number;

  // @Prop({ default: 1 })
  // level: number;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Profile", req: true })
  // profile: mongoose.Types.ObjectId;

  @Prop({ default: null })
  refreshToken: string;

  @Prop({ default: null })
  stripeCustomerId: string;

  @Prop({ default: null })
  resetCode: string;

  @Prop({ type: String, required: false })
  googleId?: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, required: false })
  deletedAt?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);
//UserSchema.index({ _id: 1 });