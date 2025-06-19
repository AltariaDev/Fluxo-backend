import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import mongoose from 'mongoose';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';


@ApiTags('Checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new checklist' })
  @ApiResponse({ status: 201, description: 'Checklist successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(@Body() createChecklistDto: CreateChecklistDto, @GetUser() user: User): Promise<CreateChecklistDto> {
    return this.checklistsService.create(createChecklistDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all checklists' })
  @ApiResponse({ status: 200, description: 'List of checklists retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll(@GetUser() user: User): Promise<CreateChecklistDto[]> {
    return this.checklistsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a checklist by ID' })
  @ApiResponse({ status: 200, description: 'Checklist successfully retrieved' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<CreateChecklistDto> {
    return this.checklistsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a checklist by ID' })
  @ApiResponse({ status: 200, description: 'Checklist successfully updated' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateChecklistDto: UpdateChecklistDto, @GetUser() user: User): Promise<CreateChecklistDto> {
    return this.checklistsService.update(id, updateChecklistDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a checklist by ID' })
  @ApiResponse({ status: 200, description: 'Checklist successfully deleted' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<CreateChecklistDto> {
    return this.checklistsService.remove(id, user.id);
  }
}
