import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './entities/banner.entity';
import mongoose from 'mongoose';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private readonly bannerModel: Model<BannerDocument>,
  ) {}

  async create(createBannerDto: CreateBannerDto, userId: mongoose.Types.ObjectId): Promise<BannerDocument> {
    try {
      const banner = await this.bannerModel.create({
        ...createBannerDto,
        userId,
      });
      return await banner.populate('userId');
    }
    catch (error) {
      throw new InternalServerErrorException("Error creating banner");
    }
  }

  async findAll(userId: mongoose.Types.ObjectId): Promise<BannerDocument[]> {
    const query: any = {
      $or: [{ userId: userId }, {userId: null}, {userId:{ $exists: false }}],
    };
    return await this.bannerModel.find(query);
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<BannerDocument> {
    let banner: Banner;
    banner = await this.bannerModel.findById(id);
    if (!banner) throw new NotFoundException(`Banner not found`);
    if (!banner.userId.equals(userId) && banner.userId) {
      throw new ForbiddenException(`Unauthorized access`);
    }
    return banner;
  }

  async findSystemBanners(): Promise<BannerDocument[]> {
    return this.bannerModel.find({ $or: [{userId: null}, {userId: { $exists: false }}] });
  }

  async findUserBanners(userId: mongoose.Types.ObjectId): Promise<BannerDocument[]> {
    return this.bannerModel.find({ userId });
  }

  async update(id: mongoose.Types.ObjectId, updateBannerDto: UpdateBannerDto, userId: mongoose.Types.ObjectId): Promise<BannerDocument> {
    const updBanner = await this.bannerModel.findById(id);
    if (!updBanner) throw new NotFoundException(`Banner not found`);
    if (!updBanner.userId.equals(userId)) { 
      throw new ForbiddenException(`Unauthorized access, you can not update this banner`);
    }
    try {
    return await this.bannerModel.findByIdAndUpdate(id, updateBannerDto, {new: true});
    } catch (error) {
      throw new InternalServerErrorException("Error updating banner");
    }
  }

  async remove(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<BannerDocument> {
    const banner = await this.bannerModel.findById(id);
    if (!banner) throw new NotFoundException(`Banner not found`);
    if (!banner.userId.equals(userId)) {
      throw new ForbiddenException(`Unauthorized access`);
    }
    try {
      return await this.bannerModel.findByIdAndDelete(id);
    } catch (error) {
      throw new InternalServerErrorException("Error deleting banner");
    }
  }
}
