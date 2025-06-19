import { Prop, SchemaFactory,  Schema } from "@nestjs/mongoose";
import { Document} from "mongoose";
import mongoose  from "mongoose";

export type BannerDocument = Banner & Document;
@Schema({ timestamps: true, versionKey: false })
export class Banner extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  userId?: mongoose.Types.ObjectId;
}
export const BannerSchema = SchemaFactory.createForClass(Banner);