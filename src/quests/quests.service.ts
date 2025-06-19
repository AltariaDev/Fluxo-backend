import { Injectable, NotFoundException } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { Quest, QuestDocument } from './entities/quest.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class QuestsService {
  constructor(
    @InjectModel(Quest.name)
    private questModel: Model<QuestDocument>

  ){}

  async findAll() {
    return await this.questModel.find().populate('reward').populate('badge').populate('tasks');;
  }

  async findOne(id: mongoose.Types.ObjectId) {
    const quest = await this.questModel.findById(id).populate('reward').populate('badge').populate('tasks');
    if(!quest) throw new NotFoundException('Quest not found');
    return quest;
  }

  async findQuestsByCategory(category: string): Promise<QuestDocument[]> {
    const quests = await this.questModel.find({category}).populate('reward').populate('badge').populate('tasks');
    if(!quests) throw new NotFoundException('Quests not found');
    return quests;
  }

  async searchQuest(title: string): Promise<QuestDocument> {
    const quest = await this.questModel.findOne({title}).populate('reward').populate('badge').populate('tasks');
    if(!quest) throw new NotFoundException('Quest not found');
    return quest;
  }

  async findQuestsByLevel(level: number): Promise<QuestDocument[]> {
    const quests = await this.questModel.find({level}).populate('reward').populate('badge').populate('tasks');
    if(!quests) throw new NotFoundException('Quests not found');
    return quests;
  }
  

}
