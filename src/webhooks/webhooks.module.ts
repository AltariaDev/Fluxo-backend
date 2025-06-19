import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordWebhookService } from './discord-webhook.service';

@Module({
  imports: [ConfigModule],
  providers: [DiscordWebhookService],
  exports: [DiscordWebhookService],
})
export class WebhooksModule {} 