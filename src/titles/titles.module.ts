import { Module } from '@nestjs/common';
import { TitlesService } from './titles.service';
import { TitlesController } from './titles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Title, TitleSchema } from './entities/title.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [TitlesController],
  imports: [MongooseModule.forFeature([{ name: Title.name, schema: TitleSchema }]), AuthModule],
  providers: [TitlesService],
  exports: [TitlesService],
})
export class TitlesModule {}
