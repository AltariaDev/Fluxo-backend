import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../users/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  create(@Body() createNoteDto: CreateNoteDto, @GetUser() user: User) {
    return this.notesService.create(createNoteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiResponse({ status: 200, description: 'List of notes retrieved successfully' })
  @ApiQuery({ name: 'taskId', required: false, description: 'Filter notes by task ID' })
  @ApiQuery({ name: 'sectionId', required: false, description: 'Filter notes by section ID' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter notes by tag' })
  @ApiQuery({ name: 'isPinned', required: false, description: 'Filter notes by pinned status' })
  @ApiQuery({ name: 'isArchived', required: false, description: 'Filter notes by archived status' })
  findAll(
    @GetUser() user: User,
    @Query('taskId') taskId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('tag') tag?: string,
    @Query('isPinned') isPinned?: string,
    @Query('isArchived') isArchived?: string,
  ) {
    const filters: any = {};
    
    if (taskId) filters.taskId = taskId;
    if (sectionId) filters.sectionId = sectionId;
    if (tag) filters.tag = tag;
    if (isPinned !== undefined) filters.isPinned = isPinned === 'true';
    if (isArchived !== undefined) filters.isArchived = isArchived === 'true';
    
    return this.notesService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiResponse({ status: 200, description: 'Note retrieved successfully' })
  findOne(@Param('id', ParseMongoIdPipe) id: string, @GetUser() user: User) {
    return this.notesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  update(
    @Param('id', ParseMongoIdPipe) id: string, 
    @Body() updateNoteDto: UpdateNoteDto,
    @GetUser() user: User
  ) {
    return this.notesService.update(id, updateNoteDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  remove(@Param('id', ParseMongoIdPipe) id: string, @GetUser() user: User) {
    return this.notesService.remove(id, user.id);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Toggle pin status of a note' })
  @ApiResponse({ status: 200, description: 'Note pin status toggled successfully' })
  togglePin(@Param('id', ParseMongoIdPipe) id: string, @GetUser() user: User) {
    return this.notesService.togglePin(id, user.id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Toggle archive status of a note' })
  @ApiResponse({ status: 200, description: 'Note archive status toggled successfully' })
  toggleArchive(@Param('id', ParseMongoIdPipe) id: string, @GetUser() user: User) {
    return this.notesService.toggleArchive(id, user.id);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add a tag to a note' })
  @ApiResponse({ status: 200, description: 'Tag added successfully' })
  addTag(
    @Param('id', ParseMongoIdPipe) id: string, 
    @Body('tag') tag: string,
    @GetUser() user: User
  ) {
    return this.notesService.addTag(id, tag, user.id);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove a tag from a note' })
  @ApiResponse({ status: 200, description: 'Tag removed successfully' })
  removeTag(
    @Param('id', ParseMongoIdPipe) id: string, 
    @Param('tag') tag: string,
    @GetUser() user: User
  ) {
    return this.notesService.removeTag(id, tag, user.id);
  }
}
