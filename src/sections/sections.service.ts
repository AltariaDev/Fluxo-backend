import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Section, SectionDocument } from './entities/section.entity';
import { TaskDocument } from 'src/tasks/entities/task.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
  ){}

  async create(createSectionDto: CreateSectionDto, userId: mongoose.Types.ObjectId): Promise<SectionDocument> {
    try {
      return await this.sectionModel.create({
        ...createSectionDto,
        userId,
      });
    }
    catch (error) {
      throw new InternalServerErrorException('Error creating section');
    }
  }

  async findAll( userId: mongoose.Types.ObjectId): Promise<SectionDocument[]> {
    try {
      return await this.sectionModel.find({userId: userId});
    } catch (error) {
      throw new InternalServerErrorException('Error getting sections');
    }
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<SectionDocument> {
    try {
      const section = await this.sectionModel.findById(id).populate('userId').populate('tasks').populate('subSections').populate('notes');
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      return section;
    } catch (error) {
      throw new InternalServerErrorException('Error getting section');
    }
  }

  async update(id: mongoose.Types.ObjectId, updateSectionDto: UpdateSectionDto, userId: mongoose.Types.ObjectId): Promise<SectionDocument> {
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      await this.sectionModel.findByIdAndUpdate(id, {
        $set: {name: updateSectionDto.name, description: updateSectionDto.description, order: updateSectionDto.order, category: updateSectionDto.category},
      },
      { new: true });
      if (updateSectionDto.tags.length || updateSectionDto.deleteTags.length) {
        await this.updateTags(id, updateSectionDto, userId);
      }
      if (updateSectionDto.tasks.length || updateSectionDto.deleteTasks.length) {
        await this.updateTasks(id, updateSectionDto, userId);
      }
      if (updateSectionDto.addSubSections.length || updateSectionDto.deleteSubSections.length) {
        await this.updateSubSections(id, updateSectionDto, userId);
      }
      if (updateSectionDto.notes.length || updateSectionDto.deleteNotes.length) {
        await this.updateNotes(id, updateSectionDto, userId);
      }
      return await this.sectionModel.findById(id).populate('userId').populate('tasks').populate('subSections').populate('notes');
    } catch (error) {
      throw new InternalServerErrorException('Error updating section');
    }
  }

  async updateTags(id: mongoose.Types.ObjectId, updateSectionDto: UpdateSectionDto, userId: mongoose.Types.ObjectId){
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if (updateSectionDto.tags.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $addToSet: {tags: { $each: updateSectionDto.tags }},
        },
        { new: true });
      }
      if (updateSectionDto.deleteTags.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $pull: {tags: { $in: updateSectionDto.deleteTags }},},
          { new: true });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error updating section');
    }
  }

  async updateTasks(id: mongoose.Types.ObjectId, updateSectionDto: UpdateSectionDto, userId: mongoose.Types.ObjectId) {
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if (updateSectionDto.tasks.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $addToSet: {tasks: { $each: updateSectionDto.tasks }},
        },
        { new: true });
      }
      if (updateSectionDto.deleteTasks.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $pull: {tasks: { $in: updateSectionDto.deleteTasks }},},
          { new: true });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error updating section');
    }
  }

  async updateSubSections(id: mongoose.Types.ObjectId, updateSectionDto: UpdateSectionDto, userId: mongoose.Types.ObjectId){
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if (updateSectionDto.addSubSections.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $addToSet: {subSections: { $each: updateSectionDto.addSubSections }},
        },
        { new: true });
      }
      if (updateSectionDto.deleteSubSections.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $pull: {subSections: { $in: updateSectionDto.deleteSubSections }},
        },
        { new: true });
      } 
    } catch (error) {
      throw new InternalServerErrorException('Error updating section');
    }
  }

  async updateNotes(id: mongoose.Types.ObjectId, updateSectionDto: UpdateSectionDto, userId: mongoose.Types.ObjectId){
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if (updateSectionDto.notes.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $addToSet: {notes: { $each: updateSectionDto.notes }},
        },
        { new: true });
      }
      if (updateSectionDto.deleteNotes.length) {
        await this.sectionModel.findByIdAndUpdate(id, {
          $pull: {notes: { $in: updateSectionDto.deleteNotes }},
        },
        { new: true });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error updating section');
    }
  }
  async remove(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<SectionDocument> {
    try {
      const section = await this.sectionModel.findById(id);
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      return await this.sectionModel.findByIdAndDelete(id);
    } catch (error) {
      throw new InternalServerErrorException('Error deleting section');
    }
  }

  async getSectionsByTags(tags: string[], userId: mongoose.Types.ObjectId): Promise<SectionDocument[]> {
    try {
      const section = await this.sectionModel.find({
        userId: userId,
        tags: { $in: tags },
      });
      if (!section) throw new NotFoundException('Section not found');
      return section;
    } catch (error) {
      throw new InternalServerErrorException('Error getting sections');
    }
  }

  async getSectionsByCategory(category: string, userId: mongoose.Types.ObjectId): Promise<SectionDocument[]> {
    try {
      const section = await this.sectionModel.find({
        userId: userId,
        category: category,
      });
      if (!section) throw new NotFoundException('Section not found');
      return section;
    } catch (error) {
        throw new InternalServerErrorException('Error getting sections');
    }
  }

  async getCompletedSections(userId: mongoose.Types.ObjectId): Promise<SectionDocument[]> {
    try {
      const section = await this.sectionModel.find({
        userId: userId,
        completedAt: { $ne: null },
      });
      if (!section) throw new NotFoundException('Section not found');
      return section;
    } catch (error) {
      throw new InternalServerErrorException('Error getting sections');
    }
  }

  async getIncompletedSections(userId: mongoose.Types.ObjectId): Promise<SectionDocument[]> {
    try {
      const section = await this.sectionModel.find({
        userId: userId,
        completedAt: null,
      });
      if (!section) throw new NotFoundException('Section not found');
      return section;
    } catch (error) {
      throw new InternalServerErrorException('Error getting sections');
    }
  }

  async getSectionProgress(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<number> {
    try {
      const section = (await this.sectionModel.findById(id)).populated('subSections');
      if (!section) throw new NotFoundException('Section not found');
      if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      const totalSubSections = section.subSections.length;
      if (!totalSubSections){
        section.completedAt ? 100 : 0;
      };
      const completedSubSections = await this.sectionModel.countDocuments({
        _id: { $in: section.subSections },
        completedAt: { $ne: null },
      });
      return Math.floor((completedSubSections / totalSubSections) * 100);
    } catch (error) {
      throw new InternalServerErrorException('Error getting section progress');
    }
  }



  // async getTasks(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument[]> {
  //   try {
  //     const section = await this.sectionModel.findById(id).populate('tasks');
  //     if (!section) throw new NotFoundException('Section not found');
  //     if (!section.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
  //     return section?.tasks || [];  
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error getting tasks');
  //   }
  // }



}
