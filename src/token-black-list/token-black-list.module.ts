import { Module } from "@nestjs/common";
import { TokenBlacklistService } from "./token-black-list.service";

@Module({
  providers: [TokenBlacklistService],
  exports: [TokenBlacklistService],
})
export class TokenBlacklistModule {}
