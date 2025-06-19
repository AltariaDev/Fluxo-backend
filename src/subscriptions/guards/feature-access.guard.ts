import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const feature = request.params.feature || request.query.feature;

    if (!feature) {
      return false;
    }

    return this.subscriptionsService.canAccessFeature(request.user['_id'], feature);
  }
} 