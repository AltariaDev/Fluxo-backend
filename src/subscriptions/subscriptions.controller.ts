import { Controller, Post, Body, Get, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-free')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a free subscription for a new user' })
  @ApiResponse({ status: 201, description: 'Free subscription created successfully' })
  async createFreeSubscription(@GetUser() user: User) {
    return this.subscriptionsService.createFreeSubscription(user.id);
  }

  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upgrade to a paid subscription' })
  @ApiResponse({ status: 201, description: 'Subscription upgraded successfully' })
  async upgradeSubscription(
    @Body('priceId') priceId: string,
    @GetUser() user: User,
  ) {
    return this.subscriptionsService.upgradeSubscription(user.id, priceId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel subscription and revert to free tier' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@GetUser() user: User) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current subscription status' })
  @ApiResponse({ status: 200, description: 'Subscription status retrieved successfully' })
  async getSubscriptionStatus(@GetUser() user: User) {
    return this.subscriptionsService.getSubscription(user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook handled successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() rawBody: Buffer,
  ) {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    try {
      const event = Stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
      await this.subscriptionsService.handleWebhook(event);
      return { received: true };
    } catch (err) {
      throw new Error(`Webhook Error: ${err.message}`);
    }
  }
} 