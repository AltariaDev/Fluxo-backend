import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BadgeDocument } from './entities/badge.entity';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';

@ApiTags('Badges')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // @Post()
  // @ApiOperation({ summary: 'Create a new badge' })
  // @ApiResponse({ status: 201, description: 'Badge successfully created' })
  // @ApiResponse({ status: 400, description: 'Invalid data provided' })
  // async create(@Body() createBadgeDto: CreateBadgeDto): Promise<BadgeDocument> {
  //   return this.badgesService.create(createBadgeDto);
  // }

  @Get()
  @ApiOperation({ summary: 'Retrieve all badges' })
  @ApiResponse({ status: 200, description: 'List of badges retrieved' })
  async findAll(): Promise<BadgeDocument[]> {
    return this.badgesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific badge by ID' })
  @ApiResponse({ status: 200, description: 'Badge retrieved' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId): Promise<BadgeDocument> {
    return this.badgesService.findOne(id);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Retrieve a specific badge by ID' })
  @ApiResponse({ status: 200, description: 'Badge retrieved' })
  @ApiResponse({ status: 404, description: 'Badge not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findByName(@Param('name') name: string): Promise<BadgeDocument> {
    return this.badgesService.findByName(name);
  }

  @Get(':reward')
  @ApiOperation({ summary: 'Retrieve a specific badge by reward' })
  @ApiResponse({ status: 200, description: 'Badge retrieved' })
  @ApiResponse({ status: 404, description: 'Badge or Reward not found' })
  async findByReward(@Param('reward', ParseMongoIdPipe) reward: mongoose.Types.ObjectId): Promise<BadgeDocument> {
    return this.badgesService.findByReward(reward);
  }

  @Get(':category')
  @ApiOperation({ summary: 'Retrieve a specific badge by category' })
  @ApiResponse({ status: 200, description: 'Badge retrieved' })
  async findByCategory(@Param('category') category: string): Promise<BadgeDocument[]> {
    return this.badgesService.findByCategory(category);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a badge by ID' })
  // @ApiResponse({ status: 200, description: 'Badge updated successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid data provided' })
  // @ApiResponse({ status: 404, description: 'Badge not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateBadgeDto: UpdateBadgeDto): Promise<BadgeDocument> {
  //   return this.badgesService.update(id, updateBadgeDto);
  // }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a badge by ID' })
  // @ApiResponse({ status: 200, description: 'Badge deleted successfully' })
  // @ApiResponse({ status: 404, description: 'Badge not found' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId): Promise<BadgeDocument> {
  //   return this.badgesService.remove(id);
  // }
}
