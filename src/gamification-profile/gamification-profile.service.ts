import { NotFoundException, ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GamificationProfile, GamificationProfileDocument } from './entities/gamification-profile.entity';
import { CreateGamificationProfileDto } from './dto/create-gamification-profile.dto';
import { UpdateGamificationProfileDto } from './dto/update-gamification-profile.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GamificationProfileService {
  // Default avatar path for new profiles
  private readonly DEFAULT_AVATAR = 'https://img.freepik.com/premium-photo/close-up-mountain-with-river-middle-generative-ai_955884-5829.jpg?w=740';

  constructor(
    @InjectModel(GamificationProfile.name) private gamificationProfileModel: Model<GamificationProfileDocument>,
    @Inject(UsersService) private readonly usersService: UsersService,
  ){}

  async create(userId: mongoose.Types.ObjectId): Promise<GamificationProfileDocument>  {
    try{
      const profile = await this.gamificationProfileModel.findOne({user: userId});
      if(profile){
        throw new ForbiddenException('User profile already exists');
      }
      const profile_new = await this.gamificationProfileModel.create({
        user: userId,
        avatar: this.DEFAULT_AVATAR, // Set default avatar
        level: 1,
        xp: 0,
        coins: 0,
        title: 'Novice'
      });
      return profile_new;
    }catch(error){
      console.error('Error creating profile:', error);
      throw new InternalServerErrorException('Error Creating Profile');
    }
  }

/*
  async findAll() {
    return `This action returns all gamificationProfile`;
  }
*/

  async findMe(userId: mongoose.Types.ObjectId): Promise<GamificationProfileDocument> {
    try{
      const profile = await this.gamificationProfileModel.findOne({ user: userId });
      //console.log('profile', profile);
      return await profile.populate('user');
    }catch (error){
      throw new InternalServerErrorException('Error getting my profile');
    }
  }
  async findOne(term: string): Promise<GamificationProfileDocument>{
    try{
      const user = await this.usersService.findOne(term);
      if (!user) {
        throw new ForbiddenException('User not found');
      }
      return await this.gamificationProfileModel.findOne({userId: user.id});
    }catch (error){
      throw new InternalServerErrorException('Error getting profile')
    }

  }

  async update(id: mongoose.Types.ObjectId, updateGamificationProfileDto: UpdateGamificationProfileDto, userId: mongoose.Types.ObjectId): Promise<GamificationProfileDocument>{
    try {
      const profile = await this.gamificationProfileModel.findById(id);
      if(!profile){
        throw new NotFoundException('Profile not found');
      }
      if(!profile.user.equals(userId)){
        throw new ForbiddenException('Foridden access');
      }
      return await this.gamificationProfileModel.findByIdAndUpdate(id, updateGamificationProfileDto, {new: true});
    } catch (error) {
      throw new InternalServerErrorException('Error updating profile');
    }
  }

  async remove(userId: mongoose.Types.ObjectId): Promise<GamificationProfileDocument> {
    try {
      const profile = await this.gamificationProfileModel.findOne({userId: userId});
      if(!profile){
        throw new NotFoundException('Profile not found');
      }
      if(!profile.user.equals(userId)){
        throw new ForbiddenException('Forbidden access');
      }
      return await this.gamificationProfileModel.findByIdAndDelete(profile.id);
    } catch (error) {
      throw new InternalServerErrorException('Error deleting profile');
    }
  }
}
