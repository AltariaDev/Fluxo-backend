import { Injectable } from "@nestjs/common";

@Injectable()
export class TokenBlacklistService {
  private blacklist = new Set<string>();

  async addToBlacklist(token: string) {
    this.blacklist.add(token);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return this.blacklist.has(token);
  }

  // 🔹 Métodos extra si necesitas administrar la blacklist desde un panel admin
  async getAllTokens(): Promise<string[]> {
    return Array.from(this.blacklist);
  }

  async removeToken(token: string): Promise<void> {
    this.blacklist.delete(token);
  }
}
