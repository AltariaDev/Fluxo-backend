import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CountdownService } from './countdown.service';
import { CreateCountdownDto } from './dto/create-countdown.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Countdown')
@ApiBearerAuth()
@Controller('countdown')
@UseGuards(JwtAuthGuard)
export class CountdownController {
  constructor(private readonly countdownService: CountdownService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new countdown timer' })
  @ApiResponse({ status: 201, description: 'Countdown timer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() req, @Body() createCountdownDto: CreateCountdownDto) {
    return this.countdownService.create(req.user.userId, createCountdownDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all countdown timers for the current user' })
  @ApiResponse({ status: 200, description: 'List of countdown timers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Request() req) {
    return this.countdownService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific countdown timer by ID' })
  @ApiResponse({ status: 200, description: 'Countdown timer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.countdownService.findOne(req.user.userId, id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a countdown timer' })
  @ApiResponse({ status: 200, description: 'Countdown timer started successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  start(@Request() req, @Param('id') id: string) {
    return this.countdownService.start(req.user.userId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a countdown timer' })
  @ApiResponse({ status: 200, description: 'Countdown timer paused successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  pause(@Request() req, @Param('id') id: string) {
    return this.countdownService.pause(req.user.userId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused countdown timer' })
  @ApiResponse({ status: 200, description: 'Countdown timer resumed successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  resume(@Request() req, @Param('id') id: string) {
    return this.countdownService.resume(req.user.userId, id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop a countdown timer' })
  @ApiResponse({ status: 200, description: 'Countdown timer stopped successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  stop(@Request() req, @Param('id') id: string) {
    return this.countdownService.stop(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a countdown timer' })
  @ApiResponse({ status: 200, description: 'Countdown timer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Countdown timer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Request() req, @Param('id') id: string) {
    return this.countdownService.delete(req.user.userId, id);
  }
} 