import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {Quest, QuestDocument} from './entities/quest.entity';

@ApiTags('Quests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('quests')
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  @Get()
  @ApiOperation({summary: 'Retrieve all quests' })
  @ApiResponse({ status: 200, description: 'List of quests retrieved' })
  async findAll(): Promise<QuestDocument[]> {
    return this.questsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a quest by its ID' })
  @ApiResponse({ status: 200, description: 'Quest retrieved' })
  @ApiResponse({ status: 404, description: 'Quest not found' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId): Promise<QuestDocument> {
    return this.questsService.findOne(id);
  }

  @Get(':category')
  @ApiOperation({ summary: 'Retrieve quests by category' })
  @ApiResponse({ status: 200, description: 'List of quests retrieved' })
  @ApiResponse({ status: 402, description: 'Invalid category' })
  @ApiResponse({ status: 404, description: 'Quests not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  async findQuestsByCategory(@Param('category') category: string): Promise<QuestDocument[]> {
    return this.questsService.findQuestsByCategory(category);
  }

  @Get('search/:title')
  @ApiOperation({ summary: 'Search for a quest by its title' })
  @ApiResponse({ status: 200, description: 'Quest retrieved' })
  @ApiResponse({ status: 404, description: 'Quest not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  async searchQuest(@Param('title') title: string): Promise<QuestDocument> {
    return this.questsService.searchQuest(title);
  }

  @Get(':level')
  @ApiOperation({ summary: 'Retrieve quests by level' })
  @ApiResponse({ status: 200, description: 'List of quests retrieved' })
  @ApiResponse({ status: 402, description: 'Invalid level' })
  @ApiResponse({ status: 404, description: 'Quests not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  async findQuestsByLevel(@Param('level') level: number): Promise<QuestDocument[]>  {
    return this.questsService.findQuestsByLevel(level);
  }


}
