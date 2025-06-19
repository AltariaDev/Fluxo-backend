import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SectionDocument } from './entities/section.entity';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { TaskDocument } from 'src/tasks/entities/task.entity';
import { NoteDocument } from 'src/notes/entities/note.entity';
import mongoose from 'mongoose';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('Sections')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({
  whitelist: true,
  transform: true,
}),)
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @ApiOperation({
    description: 'Create a new section',
  })
  @ApiResponse({ status: 201, description: 'Section created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters were passed' })
  async create(@Body() createSectionDto: CreateSectionDto, @GetUser() user: User): Promise<SectionDocument> {
    return this.sectionsService.create(createSectionDto, user.id);
  }

  @Get()
  @ApiOperation({
    description: 'Retrieve all sections',
  })
  @ApiResponse({ status: 200, description: 'List of sections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  async findAll(@GetUser() user: User): Promise<SectionDocument[]> {
    return this.sectionsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({
    description: 'Retrieve a section by ID',
  })
  @ApiResponse({ status: 200, description: 'Section retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<SectionDocument>{
    return this.sectionsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    description: 'Update a section by ID',
  })
  @ApiResponse({ status: 200, description: 'Section updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters were passed' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateSectionDto: UpdateSectionDto, @GetUser() user: User): Promise<SectionDocument> {
    return this.sectionsService.update(id, updateSectionDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ description: 'Delete a section by ID' })
  @ApiResponse({ status: 204, description: 'Section deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<SectionDocument> {
    return this.sectionsService.remove(id, user.id);
  }

  // @Get(':id/tasks')
  // @ApiOperation({ description: 'Get all tasks in a section' })
  // @ApiResponse({ status: 200, description: 'List of tasks retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  // @ApiResponse({ status: 404, description: 'Section not found' })
  // async getTasks(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<TaskDocument[]> {
  //   return this.sectionsService.getTasks(id, user.id);
  // }

  // @Get(':id/subsections')
  // @ApiOperation({ description: 'Get all subsections in a section' })
  // @ApiResponse({ status: 200, description: 'List of subsections retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  // @ApiResponse({ status: 404, description: 'Section not found' })
  // async getSubsections(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<SectionDocument[]> {
  //   return this.sectionsService.getSubsections(id, user.id);
  // }

  // @Get(':id/notes')
  // @ApiOperation({ description: 'Get all notes in a section' })
  // @ApiResponse({ status: 200, description: 'List of notes retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access'  })
  // @ApiResponse({ status: 404, description: 'Section not found' })
  // async getNotes(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<NoteDocument[]> {
  //   return this.sectionsService.getNotes(id, user.id);
  // }

  @Get('tags/:tags')
  @ApiOperation({ summary: 'Retrieve all Sections by tags' })
  @ApiResponse({ status: 200, description: 'List of sections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getSectionsByTags(@Param('tags') tags: string, @GetUser() user: User): Promise<SectionDocument[]> {
    // Se espera una cadena de tags separados por comas, por ejemplo: "tag1,tag2,tag3"
    const tagsArray = tags.split(',').map(tag => tag.trim());
    return this.sectionsService.getSectionsByTags(tagsArray, user.id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Retrieve all Sections by category' })
  @ApiResponse({ status: 200, description: 'List of sections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getSectionsByCategory(@Param('category') category: string, @GetUser() user: User): Promise<SectionDocument[]> {
    return this.sectionsService.getSectionsByCategory(category, user.id);
  }

  @Get('completed')
  @ApiOperation({ summary: 'Retrieve all completed sections' })
  @ApiResponse({ status: 200, description: 'List of completed sections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getCompletedSections(@GetUser() user: User): Promise<SectionDocument[]> {
    return this.sectionsService.getCompletedSections(user.id);
  }

  @Get('incompleted')
  @ApiOperation({ summary: 'Retrieve all incompleted sections' })
  @ApiResponse({ status: 200, description: 'List of incompleted sections retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getIncompletedSections(@GetUser() user: User): Promise<SectionDocument[]> {
    return this.sectionsService.getIncompletedSections(user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Retrieve section progress' })
  @ApiResponse({ status: 200, description: 'List of sections with progress retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getSectionsWithProgress(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<Number> {
    return this.sectionsService.getSectionProgress(id, user.id);
  }
  
}
