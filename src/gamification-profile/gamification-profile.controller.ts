import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GamificationProfileService } from './gamification-profile.service';
import { CreateGamificationProfileDto } from './dto/create-gamification-profile.dto';
import { UpdateGamificationProfileDto } from './dto/update-gamification-profile.dto';
import { ApiBearerAuth, ApiOperation, ApiResetContentResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { GamificationProfileDocument } from './entities/gamification-profile.entity';

@ApiTags('GamificationProfile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('profile')
export class GamificationProfileController {
  constructor(private readonly gamificationProfileService: GamificationProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new gamification profile' })
  @ApiResponse({ status: 201, description: 'Gamification profile successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid data provided for gamification profile creation' })
  async create(@GetUser() user: User) {
    return this.gamificationProfileService.create(user.id);
  }
/*
  @Get()
  @ApiOperation({ summary: 'Retrieve all gamification profiles' })
  @ApiResponse({ status: 200, description: 'List of gamification profiles retrieved' })
  async findAll() {
    return this.gamificationProfileService.findAll();
  }
*/
  @Get('@me')
  @ApiOperation({ summary: 'Retrieve a specific gamification profile by ID' })
  @ApiResponse({ status: 200, description: 'Gamification profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Gamification profile not found' })
  async findOne(@GetUser() user: User): Promise<GamificationProfileDocument> {
    return this.gamificationProfileService.findMe(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a gamification profile by ID' })
  @ApiResponse({ status: 200, description: 'Gamification profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided for gamification profile update' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Gamification profile not found' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateGamificationProfileDto: UpdateGamificationProfileDto, @GetUser() user: User) {
    return this.gamificationProfileService.update(id, updateGamificationProfileDto, user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a gamification profile by ID' })
  @ApiResponse({ status: 200, description: 'Gamification profile deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Gamification profile not found' })
  async remove(@GetUser() user: User): Promise<GamificationProfileDocument> {
    return this.gamificationProfileService.remove(user.id);
  }
}
