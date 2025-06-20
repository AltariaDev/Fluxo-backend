import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { StopwatchService } from './stopwatch.service';
import { CreateStopwatchDto } from './dto/create-stopwatch.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Stopwatch')
@ApiBearerAuth()
@Controller('stopwatch')
@UseGuards(JwtAuthGuard)
export class StopwatchController {
  constructor(private readonly stopwatchService: StopwatchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stopwatch' })
  @ApiResponse({ status: 201, description: 'Stopwatch created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req, @Body() createStopwatchDto: CreateStopwatchDto) {
    return this.stopwatchService.create(req.user.userId, createStopwatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stopwatches for the current user' })
  @ApiResponse({ status: 200, description: 'List of stopwatches retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req) {
    return this.stopwatchService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific stopwatch by ID' })
  @ApiResponse({ status: 200, description: 'Stopwatch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.findOne(req.user.userId, id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a stopwatch' })
  @ApiResponse({ status: 200, description: 'Stopwatch started successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  start(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.start(req.user.userId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a stopwatch' })
  @ApiResponse({ status: 200, description: 'Stopwatch paused successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  pause(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.pause(req.user.userId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused stopwatch' })
  @ApiResponse({ status: 200, description: 'Stopwatch resumed successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  resume(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.resume(req.user.userId, id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop a stopwatch' })
  @ApiResponse({ status: 200, description: 'Stopwatch stopped successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  stop(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.stop(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stopwatch' })
  @ApiResponse({ status: 200, description: 'Stopwatch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Stopwatch not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Request() req, @Param('id') id: string) {
    return this.stopwatchService.delete(req.user.userId, id);
  }
} 