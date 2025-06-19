import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateChecklistDto } from './dto/create-checklist.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Checklist, ChecklistDocument } from './entities/checklist.entity';
import mongoose, { Model } from 'mongoose';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
  ) {}

  async create(createChecklistDto: CreateChecklistDto, userId: string): Promise<ChecklistDocument> {
    try{
      return await this.checklistModel.create({
        ...createChecklistDto,
        userId,
      });
    }catch (error) {
      throw new InternalServerErrorException('Error creating checklist');
    }
  }

  async findAll(userId: string): Promise<ChecklistDocument[]> {
    try{
      return await this.checklistModel.find({userId: userId});
    }catch (error) {
      throw new InternalServerErrorException('Error getting checklists');
    }
  }

  async findOne(id: mongoose.Types.ObjectId, userId: string): Promise<ChecklistDocument> {
    try{
      return await this.checklistModel.findById(id).populate('taskId');
    }catch (error) {
      throw new InternalServerErrorException('Error getting checklist');
    }
  }

  async update(id: mongoose.Types.ObjectId, updateChecklistDto: UpdateChecklistDto, userId: string): Promise<ChecklistDocument> {
    try{
      const checklist = await this.checklistModel.findById(id);
      if (!checklist) throw new NotFoundException('Checklist not found');
      if (!checklist.userId.equals(userId)) throw new NotFoundException('Unauthorized access');
      await this.checklistModel.findByIdAndUpdate(id ,{
        $set: {name: updateChecklistDto.name, description: updateChecklistDto.description,}},{new: true});
      if (updateChecklistDto.taskId.length) {
        return await this.updateTasks(id, updateChecklistDto.taskId, false);
      }
      if (updateChecklistDto.taskToDelete.length) {
        return await this.updateTasks(id, updateChecklistDto.taskToDelete, true);
      }
      return (await this.findOne(id, userId)).populate('taskId');
    }catch (error) {
      throw new InternalServerErrorException('Error updating checklist');
    }
  }

  private async updateTasks(id: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId[], toDelete: Boolean): Promise<ChecklistDocument> {
    try{
      const checklist = await this.checklistModel.findById(id);
      if (!checklist) throw new NotFoundException('Checklist not found');
      if (toDelete) {
        return await this.checklistModel.findByIdAndUpdate(id, { $pull: { taskId: { $in: taskId } } }, { new: true });
      } else {
        return await this.checklistModel.findByIdAndUpdate(id, { $addToSet: { $each: taskId } }, { new: true });
      }
    }catch (error) {
      throw new InternalServerErrorException('Error updating tasks');
    }
  
  }

  async remove(id: mongoose.Types.ObjectId, userId: string): Promise<ChecklistDocument> {
    try{
      const checklist = await this.checklistModel.findById(id);
      if (!checklist) throw new NotFoundException('Checklist not found');
      if (!checklist.userId.equals(userId)) throw new NotFoundException('Unauthorized access');
      return await this.checklistModel.findByIdAndDelete(id);
    }catch (error) {
      throw new InternalServerErrorException('Error deleting checklist');
    }
  }
}
