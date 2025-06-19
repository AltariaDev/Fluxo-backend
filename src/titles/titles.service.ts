import { CreateTitleDto } from './dto/create-title.dto';
import { UpdateTitleDto } from './dto/update-title.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Title, TitleDocument } from './entities/title.entity';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';


@Injectable()
export class TitlesService {
  constructor(
    @InjectModel(Title.name)
    private readonly titleModel: Model<TitleDocument>,
  ) {}

  async findAll(): Promise<TitleDocument[]> {
    return this.titleModel.find();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<TitleDocument> {
    try {
      const tit = await this.titleModel.findById(id);
      if (!tit) {
        throw new NotFoundException('Title not found');
        }
      return tit;
    } catch (error) {
      throw new InternalServerErrorException('Error finding title');
    }
  }

  async search(title: string): Promise<TitleDocument> {
    try {
      const tit = await this.titleModel.findOne({ title });
      if (!tit) {
        throw new NotFoundException('Title not found');
      }
      return tit;
      } catch (error) {
        throw new InternalServerErrorException('Error finding title');
      }
  }
}
