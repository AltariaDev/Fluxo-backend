import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface DiscordWebhookMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
}

@Injectable()
export class DiscordWebhookService {
  private readonly logger = new Logger(DiscordWebhookService.name);
  private readonly webhookUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
    if (!this.webhookUrl) {
      this.logger.warn('Discord webhook URL not configured');
    }
  }

  private async sendWebhook(message: DiscordWebhookMessage): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('Discord webhook URL not configured, skipping notification');
      return;
    }
    if(this.configService.get<string>('NODE_ENV') !== 'production'){
      this.logger.warn('Not in production, skipping notification');
      return;
    }

    try {
      await axios.post(this.webhookUrl, message);
    } catch (error) {
      this.logger.error(`Failed to send Discord webhook: ${error.message}`);
    }
  }

  async notifyNewUser(username: string, email: string, googleLogin?: boolean): Promise<void> {
    const embed: DiscordEmbed = {
      title: '👤 New User Registration',
      description: 'A new user has registered in the application',
      color: 0x00ff00, // Green color
      fields: [
        { name: 'Username', value: username, inline: true },
        { name: 'Email', value: email, inline: true },
        { name: 'Google Login', value: googleLogin ? 'Yes' : 'No', inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SherpApp User Registration'
      }
    };

    await this.sendWebhook({ embeds: [embed] });
  }

  async notifyUserLogin(username: string): Promise<void> {
    const embed: DiscordEmbed = {
      title: '🔐 User Login',
      description: 'A user has logged into the application',
      color: 0x0099ff, // Blue color
      fields: [
        { name: 'Username', value: username }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SherpApp User Login'
      }
    };

    await this.sendWebhook({ embeds: [embed] });
  }

  async notifyUserLogout(username: string): Promise<void> {
    const embed: DiscordEmbed = {
      title: '🚪 User Logout',
      description: 'A user has logged out of the application',
      color: 0xff0000, // Red color
      fields: [
        { name: 'Username', value: username }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SherpApp User Logout'
      }
    };

    await this.sendWebhook({ embeds: [embed] });
  }

  async notifyPomodoroCompleted(username: string, duration: number): Promise<void> {
    const embed: DiscordEmbed = {
      title: '⏰ Pomodoro Completed',
      description: 'A pomodoro session has been completed',
      color: 0xff0000, // Red color
      fields: [
        { name: 'User', value: username, inline: true },
        { name: 'Duration', value: `${Math.floor(duration / 60)} minutes`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SherpApp Pomodoro Timer'
      }
    };

    await this.sendWebhook({ embeds: [embed] });
  }
} 