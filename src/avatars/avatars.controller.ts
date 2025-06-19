import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { AvatarDocument } from './entities/avatar.entity';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';

@ApiTags('Avatars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new avatar' })
  @ApiResponse({ status: 201, description: 'Avatar successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(@Body() createAvatarDto: CreateAvatarDto, @GetUser() user: User): Promise<AvatarDocument> {
    return this.avatarsService.create(createAvatarDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all avatars' })
  @ApiResponse({ status: 200, description: 'List of avatars retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll( @GetUser() user: User): Promise<AvatarDocument[]> {
    return this.avatarsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an avatar by id' })
  @ApiResponse({ status: 200, description: 'Avatar retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<AvatarDocument> {
    return this.avatarsService.findOne(id, user.id);
  }

  @Get('user')
  @ApiOperation({ summary: 'Retrieve all avatars made by the user' })
  @ApiResponse({ status: 200, description: 'List of avatars retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findUsersAvatars(@GetUser() user: User): Promise<AvatarDocument[]> {
    return this.avatarsService.findUsersAvatars(user.id);
  }

  @Get('system')
  @ApiOperation({ summary: 'Retrieve all system avatars' })
  @ApiResponse({ status: 200, description: 'List of avatars retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findSystemAvatars(): Promise<AvatarDocument[]> {
    return this.avatarsService.findSystemAvatars();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateAvatarDto: UpdateAvatarDto, @GetUser() user: User): Promise<AvatarDocument> {
    return this.avatarsService.update(id, updateAvatarDto, user.id);
  }

  @Delete('softDelete/:id')
  @ApiOperation({ summary: 'Delete an avatar' })
  @ApiResponse({ status: 200, description: 'Avatar deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  async softDelete(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<AvatarDocument> {
    return this.avatarsService.softDelete(id, user.id);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete an avatar' })
  // @ApiResponse({ status: 200, description: 'Avatar deleted' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Avatar not found' })
  // async remove(@Param('id') id: string, @GetUser() user: User): Promise<AvatarDocument> {
  //   return this.avatarsService.remove(id);
  // }
}
