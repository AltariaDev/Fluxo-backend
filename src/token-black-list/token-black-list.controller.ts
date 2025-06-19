import { Controller, Get, Post, Param, Delete } from "@nestjs/common";
import { TokenBlacklistService } from "./token-black-list.service";

@Controller("token-blacklist")
export class TokenBlacklistController {
  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {}

  @Post(":token")
  async blacklistToken(@Param("token") token: string) {
    await this.tokenBlacklistService.addToBlacklist(token);
    return { message: "Token added to blacklist" };
  }

  @Get(":token")
  async checkBlacklist(@Param("token") token: string) {
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
    return { blacklisted: isBlacklisted };
  }

  @Delete(":token")
  async removeToken(@Param("token") token: string) {
    await this.tokenBlacklistService.removeToken(token);
    return { message: "Token removed from blacklist" };
  }

  @Get()
  async getAllBlacklistedTokens() {
    return this.tokenBlacklistService.getAllTokens();
  }
}
