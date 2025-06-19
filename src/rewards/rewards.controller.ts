import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { Reward } from './entities/reward.entity';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';

@ApiTags('Rewards')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rewards' })
  @ApiResponse({ status: 200, description: 'List of rewards retrieved' })
  async findAll() {
    return this.rewardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reward by its id' })
  @ApiResponse({ status: 200, description: 'Reward retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId) {
    return this.rewardsService.findOne(id);
  }

}
