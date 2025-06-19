import { Injectable, NotFoundException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note, NoteDocument } from './entities/note.entity';
import { Types } from 'mongoose';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectModel(Note.name) private noteModel: Model<NoteDocument>,
  ) {}

  async create(createNoteDto: CreateNoteDto, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      this.logger.debug(`Creating note for user ${userId}: ${createNoteDto.title}`);
      
      const note = new this.noteModel({
        ...createNoteDto,
        user: userId,
        task: createNoteDto.taskId ? new Types.ObjectId(createNoteDto.taskId) : undefined,
        section: createNoteDto.sectionId ? new Types.ObjectId(createNoteDto.sectionId) : undefined,
      });

      return await note.save();
    } catch (error) {
      this.logger.error(`Error creating note: ${error.message}`);
      throw new InternalServerErrorException('Error creating note');
    }
  }

  async findAll(userId: Types.ObjectId, filters?: {
    taskId?: string;
    sectionId?: string;
    tag?: string;
    isPinned?: boolean;
    isArchived?: boolean;
  }): Promise<NoteDocument[]> {
    try {
      const query: any = { user: userId };
      
      if (filters) {
        if (filters.taskId) {
          query.task = new Types.ObjectId(filters.taskId);
        }
        if (filters.sectionId) {
          query.section = new Types.ObjectId(filters.sectionId);
        }
        if (filters.tag) {
          query.tags = filters.tag;
        }
        if (filters.isPinned !== undefined) {
          query.isPinned = filters.isPinned;
        }
        if (filters.isArchived !== undefined) {
          query.isArchived = filters.isArchived;
        }
      }

      return await this.noteModel.find(query).sort({ isPinned: -1, updatedAt: -1 });
    } catch (error) {
      this.logger.error(`Error finding notes: ${error.message}`);
      throw new InternalServerErrorException('Error finding notes');
    }
  }

  async findOne(id: string, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }
      
      return note;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error finding note: ${error.message}`);
      throw new InternalServerErrorException('Error finding note');
    }
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      // Create a copy of the DTO to avoid modifying the original
      const updateData = { ...updateNoteDto };

      // Convert taskId and sectionId to ObjectId if provided
      if (updateData.taskId) {
        updateData['task'] = new Types.ObjectId(updateData.taskId);
        delete updateData.taskId;
      }
      
      if (updateData.sectionId) {
        updateData['section'] = new Types.ObjectId(updateData.sectionId);
        delete updateData.sectionId;
      }

      const updatedNote = await this.noteModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      return updatedNote;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error updating note: ${error.message}`);
      throw new InternalServerErrorException('Error updating note');
    }
  }

  async remove(id: string, userId: Types.ObjectId): Promise<void> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      await this.noteModel.deleteOne({ _id: id });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error removing note: ${error.message}`);
      throw new InternalServerErrorException('Error removing note');
    }
  }

  async togglePin(id: string, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      const updatedNote = await this.noteModel.findByIdAndUpdate(
        id,
        { isPinned: !note.isPinned },
        { new: true }
      );

      return updatedNote;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error toggling pin: ${error.message}`);
      throw new InternalServerErrorException('Error toggling pin');
    }
  }

  async toggleArchive(id: string, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      const updatedNote = await this.noteModel.findByIdAndUpdate(
        id,
        { isArchived: !note.isArchived },
        { new: true }
      );

      return updatedNote;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error toggling archive: ${error.message}`);
      throw new InternalServerErrorException('Error toggling archive');
    }
  }

  async addTag(id: string, tag: string, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      if (!note.tags.includes(tag)) {
        const updatedNote = await this.noteModel.findByIdAndUpdate(
          id,
          { $push: { tags: tag } },
          { new: true }
        );

        return updatedNote;
      }

      return note;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error adding tag: ${error.message}`);
      throw new InternalServerErrorException('Error adding tag');
    }
  }

  async removeTag(id: string, tag: string, userId: Types.ObjectId): Promise<NoteDocument> {
    try {
      const note = await this.noteModel.findById(id);
      
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      
      if (!note.user.equals(userId)) {
        throw new UnauthorizedException('Unauthorized access to note');
      }

      const updatedNote = await this.noteModel.findByIdAndUpdate(
        id,
        { $pull: { tags: tag } },
        { new: true }
      );

      return updatedNote;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error removing tag: ${error.message}`);
      throw new InternalServerErrorException('Error removing tag');
    }
  }
}
