import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true, expires: "7d", versionKey: false }) // 🔹 Expira automáticamente en 7 días
export class TokenBlacklist extends Document {
  @Prop({ required: true })
  refreshToken: string; // 🔹 Almacenamos los tokens revocados
}

export const TokenBlacklistSchema =
  SchemaFactory.createForClass(TokenBlacklist);
