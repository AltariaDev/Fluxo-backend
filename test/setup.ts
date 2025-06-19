import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

process.env.MONGODB_URI = 'mongodb://localhost:27017/sherpapp-test';
process.env.JWT_SECRET = 'test-secret';

export const TestDatabaseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: process.env.MONGODB_URI,
  }),
  inject: [ConfigService],
}); 