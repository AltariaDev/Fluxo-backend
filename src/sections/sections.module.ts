import { Module } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Section, SectionSchema } from './entities/section.entity';

@Module({
  imports: [MongooseModule.forFeature([{name: Section.name, schema: SectionSchema}]) , AuthModule],
  exports: [SectionsService],
  controllers: [SectionsController],
  providers: [SectionsService],
})
export class SectionsModule {}
