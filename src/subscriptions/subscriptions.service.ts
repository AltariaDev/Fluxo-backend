import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Subscription, SubscriptionTier } from './entities/subscription.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-04-30.basil',
    });
  }

  async createFreeSubscription(userId: mongoose.Types.ObjectId): Promise<Subscription> {
    const user = await this.usersService.findOne(userId.toString());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a subscription
    const existingSubscription = await this.subscriptionModel.findOne({ userId });
    if (existingSubscription) {
      return existingSubscription;
    }

    // Create free subscription in database
    const newSubscription = await this.subscriptionModel.create({
      userId,
      tier: SubscriptionTier.FREE,
      isActive: true,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Set to 1 year from now for free tier
    });

    return newSubscription;
  }

  async upgradeSubscription(userId: mongoose.Types.ObjectId, priceId: string): Promise<Subscription> {
    const user = await this.usersService.findOne(userId.toString());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get existing subscription
    const existingSubscription = await this.subscriptionModel.findOne({ userId });
    if (!existingSubscription) {
      throw new NotFoundException('No subscription found. Please contact support.');
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;
      await this.usersService.update(userId.toString(), { stripeCustomerId: customerId });
    }

    // Create subscription in Stripe
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    }) as unknown as { 
      id: string; 
      status: string; 
      current_period_start: number; 
      current_period_end: number; 
    };

    // Update existing subscription
    existingSubscription.tier = SubscriptionTier.PREMIUM;
    existingSubscription.stripeCustomerId = customerId;
    existingSubscription.stripeSubscriptionId = stripeSubscription.id;
    existingSubscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    existingSubscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    existingSubscription.isActive = stripeSubscription.status === 'active';

    await existingSubscription.save();
    return existingSubscription;
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findOne({ userId });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      // Reset to free tier instead of just marking inactive
      subscription.tier = SubscriptionTier.FREE;
      subscription.isActive = true;
      subscription.stripeSubscriptionId = null;
      subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return subscription.save();
  }

  async getSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findOne({ userId });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.updated':
        const stripeSubscription = event.data.object as unknown as { 
          id: string; 
          status: string; 
          current_period_start: number; 
          current_period_end: number; 
        };
        await this.subscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: stripeSubscription.id },
          {
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            isActive: stripeSubscription.status === 'active',
            tier: stripeSubscription.status === 'active' ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE,
          },
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as unknown as { id: string };
        // Instead of just marking as inactive, reset to free tier
        await this.subscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: deletedSubscription.id },
          {
            isActive: true,
            tier: SubscriptionTier.FREE,
            stripeSubscriptionId: null,
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        );
        break;
    }
  }

  // Feature access control methods
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    
    // Define feature access based on subscription tier
    const featureAccess = {
      'unlimited_habits': [SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE],
      'advanced_analytics': [SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE],
      'custom_reminders': [SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE],
      'priority_support': [SubscriptionTier.ENTERPRISE],
      'team_collaboration': [SubscriptionTier.ENTERPRISE],
      // Add more features as needed
    };

    return featureAccess[feature]?.includes(subscription.tier) || false;
  }
} 