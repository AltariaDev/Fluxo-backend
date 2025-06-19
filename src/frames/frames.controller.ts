import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FramesService } from './frames.service';
import { Frame, FrameDocument } from './entities/frame.entity';
import mongoose from 'mongoose';

@ApiTags('Frames')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('frames')
export class FramesController {
  constructor(private readonly framesService: FramesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all frames' })
  @ApiResponse({ status: 200, description: 'List of frames retrieved' })
  async findAll(): Promise<FrameDocument[]> {
    return this.framesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a frame by its ID' })
  @ApiResponse({ status: 200, description: 'Frame retrieved' })
  @ApiResponse({ status: 404, description: 'Frame not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId): Promise<FrameDocument> {
    return this.framesService.findOne(id);
  }
}
