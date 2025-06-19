import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { EventsCalendarService } from './events-calendar.service';
import { CreateEventsCalendarDto } from './dto/create-events-calendar.dto';
import { UpdateEventsCalendarDto } from './dto/update-events-calendar.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EventsCalendarDocument } from './entities/events-calendar.entity';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import mongoose from 'mongoose';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';


@ApiTags('Events Calendar')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@Controller('events-calendar')
export class EventsCalendarController {
  constructor(private readonly eventsCalendarService: EventsCalendarService) {}

  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @Post()
  async create(@Body() createEventsCalendarDto: CreateEventsCalendarDto, @GetUser() user: User): Promise<EventsCalendarDocument> {
    return this.eventsCalendarService.create(createEventsCalendarDto, user.id);
  }

  @ApiOperation({ summary: 'Retrieve all events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No events found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @Get()
  async findAll(@GetUser() user: User): Promise<EventsCalendarDocument[]> {
    return this.eventsCalendarService.findAll(user.id);
  }

  @ApiOperation({ summary: 'Retrieve events within a date range (including recurring events)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date range provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiQuery({ name: 'startDate', description: 'Start date for range (ISO string)', example: '2024-01-01T00:00:00Z' })
  @ApiQuery({ name: 'endDate', description: 'End date for range (ISO string)', example: '2024-01-31T23:59:59Z' })
  @Get('range')
  async findEventsInRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @GetUser() user: User
  ): Promise<EventsCalendarDocument[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.eventsCalendarService.findEventsInRange(user.id, start, end);
  }

  @ApiOperation({ summary: 'Retrieve an event by ID' })
  @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId format' })
  @Get(':id')
  async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<EventsCalendarDocument> {
    return this.eventsCalendarService.findOne(id, user.id);
  }

  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @Patch(':id')
  async update(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateEventsCalendarDto: UpdateEventsCalendarDto, @GetUser() user: User): Promise<EventsCalendarDocument> {
    return this.eventsCalendarService.update(id, updateEventsCalendarDto, user.id);
  }

  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @Delete(':id')
  async remove(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<EventsCalendarDocument> {
    return this.eventsCalendarService.remove(id, user.id);
  }

  @ApiOperation({ summary: 'Admin test endpoint for recurring events' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  @Get('admin/test')
  async test(@GetUser() user: User): Promise<{ message: string; examples: any[] }> {
    return {
      message: 'Recurring events module working correctly',
      examples: [
        {
          description: 'Weekly recurring event every Monday and Friday',
          payload: {
            title: 'Team Standup',
            description: 'Daily team standup meeting',
            startDate: '2024-01-15T09:00:00Z',
            duration: 30,
            category: 'Meeting',
            recurrence: {
              frequency: 'weekly',
              interval: 1,
              daysOfWeek: [1, 5], // Monday and Friday
              maxOccurrences: 20
            }
          }
        },
        {
          description: 'Monthly recurring event',
          payload: {
            title: 'Monthly Review',
            description: 'Monthly team review meeting',
            startDate: '2024-01-01T14:00:00Z',
            duration: 120,
            category: 'Meeting',
            recurrence: {
              frequency: 'monthly',
              interval: 1,
              endDate: '2024-12-31T23:59:59Z'
            }
          }
        }
      ]
    };
  }
}
