import { Module, OnModuleInit } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Stat, StatSchema } from './entities/stats.entity';
import { Logger } from '@nestjs/common';

@Module({
  imports: [MongooseModule.forFeature([{name: Stat.name, schema: StatSchema}])], // Aquí puedes importar otros módulos si es necesario
  providers: [StatsService],
  exports: [StatsService], // Exporta el servicio si lo necesitas en otros módulos
})
export class StatsModule implements OnModuleInit {
  private readonly logger = new Logger(StatsModule.name);

  constructor(private readonly statsService: StatsService) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing application stats...');
      await this.statsService.initializeStats();
      this.logger.log('Application stats initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize application stats: ${error.message}`);
    }
  }
}
