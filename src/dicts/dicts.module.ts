import { Module } from "@nestjs/common";
import { DictsService } from "./dicts.service";
import { DictsController } from "./dicts.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Dict, DictSchema } from "./entities/dict.entity";
import { AuthModule } from "src/auth/auth.module";

@Module({
  controllers: [DictsController],
  providers: [DictsService],
  imports: [
    MongooseModule.forFeature([{ name: Dict.name, schema: DictSchema }]), AuthModule
  ],
  exports: [DictsService],
})
export class DictsModule {}
