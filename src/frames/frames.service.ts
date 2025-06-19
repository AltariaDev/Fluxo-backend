import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Frame, FrameDocument } from './entities/frame.entity'; // Add this line to import Frame
import mongoose, { Model, Mongoose } from 'mongoose';

@Injectable()
export class FramesService {

  constructor(
    @InjectModel(Frame.name)
    private readonly frameModel: Model<FrameDocument>
  ) {}

  async findAll(): Promise<FrameDocument[]> {
    return this.frameModel.find();
  }

  async findOne(id: mongoose.Types.ObjectId): Promise<FrameDocument>{
    try {
      const frame = await this.frameModel.findById(id);
      if (!frame) {
        throw new NotFoundException('Frame not found');
      }
      return frame;
    } catch (error) {
      throw new InternalServerErrorException('Error finding frame');
    }
  }
}
