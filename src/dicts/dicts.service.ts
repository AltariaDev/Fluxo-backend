import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import * as sanitizeHtml from 'sanitize-html';
import { CreateDictDto, UpdateDictDto, AddDeleteWordDto, UpdateUserSharedWithDto } from "./dto/index";
import { Dict, DictDocument, Word } from "./entities/dict.entity";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { isValidObjectId, Model } from "mongoose";


@Injectable()
export class DictsService {
  constructor(
    @InjectModel(Dict.name)
    private readonly dictModel: Model<DictDocument>,
  ) {}

  async create(ownerId: mongoose.Types.ObjectId, createDictDto: CreateDictDto): Promise<DictDocument> {
    try {
      createDictDto.description = sanitizeHtml(createDictDto.description);
      const dict = await this.dictModel.create({
        ...createDictDto,
        ownerId,
      });
      return await dict.populate('ownerId');
    } catch (error) {
      throw new InternalServerErrorException("Error creating dict");
    }
  }

  async findAll(ownerId: mongoose.Types.ObjectId): Promise<DictDocument[]> {
    const query: any = {
        $or: [
          { ownerId: ownerId },
          { "sharedWith.userId": ownerId },
        ]
    };
    return this.dictModel.find(query).populate('ownerId');
  }

  // async findAllPublic(): Promise<DictDocument[]> {
  //   return this.dictModel.find({ public: true, isDeleted: false });
  // }

  async findOne(id: string, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    let dict: Dict;
    dict = await this.dictModel.findById(id);
    if (!dict) throw new NotFoundException(`Dict not found`);
    const isOwner = dict.ownerId.equals(userId);
    const isShared = dict.sharedWith.some(u => u.userId === userId);
    if (!isOwner && !isShared) throw new ForbiddenException(`Unauthorized access`);
    return await dict.populate({path: 'ownerId', select: 'username'});
  }

  async update(id: string, updateDictDto: UpdateDictDto, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const updDict = await this.findOne(id, userId);
    if (!updDict) throw new NotFoundException(`Dict not found`);
    const isOwner = updDict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not update this dict`);
    try {
      await this.dictModel.findByIdAndUpdate(id,
        {
          $set: {name: updateDictDto.name, description: sanitizeHtml(updateDictDto.description), public: updateDictDto.public},
        },
        {new: true}).populate('ownerId');
      if (updateDictDto.updateTags.length) {
        await this.dictModel.findByIdAndUpdate(id,
          {
            $addToSet: {tags: { $each: updateDictDto.updateTags }},
          },
          {new: true});
      }
      if (updateDictDto.deleteTags.length) {
        await this.dictModel.findByIdAndUpdate
        (id, { $pull: {tags: { $in: updateDictDto.deleteTags }}}, {new: true});
      }
      return await this.findOne(id, userId);
    } catch (error) {
      throw new InternalServerErrorException("Error updating dict");
    }
  }

  async updateUsersDict(id: string, updateUserSharedWithDto: UpdateUserSharedWithDto, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const updDict = await this.findOne(id, userId);
    if (!updDict) throw new NotFoundException(`Dict not found`);
    const isOwner = updDict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not update this dict`);
    try {
      let updateDict;
      if (updateUserSharedWithDto.sharedUsers) {
        updateDict = await this.dictModel.findByIdAndUpdate(id, { $addToSet: {sharedWith: { $each: updateUserSharedWithDto.sharedUsers }}}, {new: true});
      }
      if (updateUserSharedWithDto.deleteSharedWith) {
        updateDict = await this.dictModel.findByIdAndUpdate (id, { $pull: {sharedWith: {userId: { $in: updateUserSharedWithDto.deleteSharedWith }}}}, {new: true});
      }
      return await updateDict.populate('ownerId', 'sharedWith.userId');
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException("Error updating dict");
    }
  }

  async addWord(id: string, addWordDto: AddDeleteWordDto, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const updDict = await this.findOne(id, userId);
    if (!updDict) throw new NotFoundException(`Dict not found`);
    const isOwner = updDict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not update this dict`);
    try {
      const word = {word: sanitizeHtml(addWordDto.word), definition: sanitizeHtml( addWordDto.definition), example: sanitizeHtml(addWordDto.example)};
      const updateDict = await this.dictModel.findByIdAndUpdate(id,
        {
          $addToSet: { words: word },
        },
        {new: true});
      return updateDict;
    } catch (error) {
      throw new InternalServerErrorException("Error updating dict / adding word");
    }
  }

  async deleteWord(id: string, word: AddDeleteWordDto, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const updDict = await this.findOne(id, userId);
    if (!updDict) throw new NotFoundException(`Dict not found`);
    const isOwner = updDict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not update this dict`);
    try {
      return await this.dictModel.findByIdAndUpdate(id,
        {
          $pull: { words: word },
        },
        {new: true});
    } catch (error) {
      throw new InternalServerErrorException("Error updating dict / deleting word");
    }
  }


  async softDelete(id: string, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const dict = await this.findOne(id, userId);
    if (!dict) throw new NotFoundException(`Dict not found`);
    const isOwner = dict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not delete this dict`);
    try {
      return await this.dictModel.findByIdAndUpdate(id,
        {
          $set: {isDeleted: true},
        },
        {new: true}).populate('ownerId');
    } catch (error) {
      throw new InternalServerErrorException("Error deleting dict");
    }
  }
  
  async remove(id: string, userId: mongoose.Types.ObjectId): Promise<DictDocument> {
    const dict = await this.findOne(id, userId);
    if (!dict) throw new NotFoundException(`Dict not found`);
    const isOwner = dict.ownerId.equals(userId);
    if (!isOwner) throw new ForbiddenException(`Unauthorized access, you can not delete this dict`);
    try {
      return await this.dictModel.findByIdAndDelete(id);
    } catch (error) {
      throw new InternalServerErrorException("Error deleting dict");
    }
  }
}

