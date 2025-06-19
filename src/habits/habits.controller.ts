import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { HabitDocument } from './entities/habit.entity';

@ApiTags('Habits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit' })
  @ApiResponse({ status: 201, description: 'Habit successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async create(@Body() createHabitDto: CreateHabitDto, @GetUser() user: User): Promise<HabitDocument> {
    return this.habitsService.create(createHabitDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all users habits' })
  @ApiResponse({ status: 200, description: 'List of habits retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll(@GetUser() user: User): Promise<HabitDocument[]> {
    return this.habitsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a habit by ID' })
  @ApiResponse({ status: 200, description: 'Habit successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() userInfo: User): Promise<HabitDocument> {
    return this.habitsService.findOne(id, userInfo.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit by ID' })
  @ApiResponse({ status: 200, description: 'Habit successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateHabitDto: UpdateHabitDto, @GetUser() user: User): Promise<HabitDocument> {
    return this.habitsService.update(id, updateHabitDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a habit by ID' })
  @ApiResponse({ status: 200, description: 'Habit successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Habit not found' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<HabitDocument> {
    return this.habitsService.remove(id, user.id);
  }
}
