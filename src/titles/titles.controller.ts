import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe } from '@nestjs/common';
import { Title, TitleDocument } from './entities/title.entity';
import { TitlesService } from './titles.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';

@ApiTags('titles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}


  @Get()
  @ApiOperation({ summary: 'Retrieve all titles' })
  @ApiResponse({ status: 200, description: 'List of titles retrieved' })
  async findAll(): Promise<TitleDocument[]> {
    return this.titlesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a title by its ID' })
  @ApiResponse({ status: 200, description: 'Title retrieved' })
  @ApiResponse({ status: 404, description: 'Title not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId): Promise<TitleDocument> {
    return this.titlesService.findOne(id);
  }

  @Get('search/:title')
  @ApiOperation({ summary: 'Search for a title by its title' })
  @ApiResponse({ status: 200, description: 'Title retrieved' })
  @ApiResponse({ status: 404, description: 'Title not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async search(@Param('title') title: string): Promise<TitleDocument> {
    return this.titlesService.search(title);
  }
}
