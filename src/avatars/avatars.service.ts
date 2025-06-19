import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { Avatar, AvatarDocument } from './entities/avatar.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Injectable()
export class AvatarsService {

  constructor(
    @InjectModel(Avatar.name)
    private readonly avatarModel: Model<AvatarDocument>,
  ) {}
  async create(createAvatarDto: CreateAvatarDto, userId: mongoose.Types.ObjectId): Promise<AvatarDocument> {
    try {
      const avatar = await this.avatarModel.create({
        ...createAvatarDto,
        userId,
      });
      return await avatar.populate('userId');
    } catch (error) {
      throw new InternalServerErrorException("Error creating avatar");
    }
  }

  async findAll(userId: mongoose.Types.ObjectId): Promise<AvatarDocument[]> {
    const query: any = {
      $or: [{ userId: userId }, {userId: null}, {userId:{ $exists: false }}],
    };
    return this.avatarModel.find(query);
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<AvatarDocument> {
    let avatar: Avatar;
    avatar = await this.avatarModel.findById(id);
    if (!avatar) throw new NotFoundException(`Avatar not found`);
    if (!avatar.userId.equals(userId) && avatar.userId) {
      throw new ForbiddenException(`Unauthorized access`);
    }
    return avatar;
  }

  async findUsersAvatars(userId: mongoose.Types.ObjectId): Promise<AvatarDocument[]> {
    return this.avatarModel.find({ userId });
  }
  
  async findSystemAvatars(): Promise<AvatarDocument[]> {
    return this.avatarModel.find({ $or: [{userId: null}, {userId: { $exists: false }}] });
  }
  
  async update(id: mongoose.Types.ObjectId, updateAvatarDto: UpdateAvatarDto, userId: mongoose.Types.ObjectId): Promise<AvatarDocument> {
    const updAvatar = await this.avatarModel.findById(id);
    if (!updAvatar) throw new NotFoundException(`Avatar not found`);
    if (updAvatar.userId.equals(userId)) { 
      throw new ForbiddenException(`Unauthorized access, you can not update this avatar`);
    }
    try {
      return await this.avatarModel.findByIdAndUpdate(id, updateAvatarDto, {new: true});
    } catch (error) {
      throw new InternalServerErrorException("Error updating avatar");
    } 
  }

  async softDelete(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<AvatarDocument> {
    const avatar = await this.avatarModel.findById(id);
    if (!avatar) throw new NotFoundException(`Avatar not found`);
    if (avatar.userId.equals(userId)) {
      throw new ForbiddenException(`Unauthorized access`);
    }
    try {
      return await this.avatarModel.findByIdAndUpdate(id, {isDeleted: true}, {new: true});
    }
    catch (error) {
      throw new InternalServerErrorException("Error deleting avatar");
    }
  }

  // async remove(id: string): Promise<AvatarDocument> {
  //   const avatar = await this.avatarModel.findById(id);
  //   if (!avatar) throw new NotFoundException(`Avatar not found`);
  //   if (avatar.userId.equals(userId)) {
  //     throw new ForbiddenException(`Unauthorized access`);
  //   }
  //   try {
  //     return await this.avatarModel.findByIdAndUpdate(id, {isDeleted: true}, {new: true});
  //   }
  //   catch (error) {
  //     throw new InternalServerErrorException("Error deleting avatar");
  //   }
  // }
}
