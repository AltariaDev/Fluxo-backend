import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { BannerDocument } from './entities/banner.entity';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';

@ApiTags('Banners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  create(@Body() createBannerDto: CreateBannerDto, @GetUser() user: User) {
    return this.bannersService.create(createBannerDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all banners' })
  @ApiResponse({ status: 200, description: 'List of banners retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll(@GetUser() user: User): Promise<BannerDocument[]> {
    return this.bannersService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a banner by id' })
  @ApiResponse({ status: 200, description: 'Banner retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<BannerDocument> {
    return this.bannersService.findOne(id, user.id);
  }

  @Get('system')
  @ApiOperation({ summary: 'Get a banner by id' })
  @ApiResponse({ status: 200, description: 'List of banners retrieved'})
  async findSystemBanners(): Promise<BannerDocument[]> {
    return this.bannersService.findSystemBanners();
  }
  
  @Get('user')
  @ApiOperation({ summary: 'Get a banner by id' })
  @ApiResponse({ status: 200, description: 'List of banners retrieved' })
  async findUserBanners(
    @GetUser()
    user: User
  ): Promise<BannerDocument[]> {
    return this.bannersService.findUserBanners(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing banner' })
  @ApiResponse({ status: 200, description: 'Banner updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateBannerDto: UpdateBannerDto, @GetUser() user: User): Promise<BannerDocument> {
    return this.bannersService.update(id, updateBannerDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiResponse({ status: 200, description: 'Banner deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Banner not found' })
  remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User) {
    return this.bannersService.remove(id, user.id);
  }
}
