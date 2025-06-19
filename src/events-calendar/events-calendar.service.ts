import { BadRequestException, ForbiddenException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateEventsCalendarDto } from './dto/create-events-calendar.dto';
import { UpdateEventsCalendarDto } from './dto/update-events-calendar.dto';
import { InjectModel } from '@nestjs/mongoose';
import { EventsCalendar, EventsCalendarDocument, RecurrenceFrequency, DayOfWeek, RecurrencePattern } from './entities/events-calendar.entity';
import mongoose, { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsList } from 'src/events/list.events';

@Injectable()
export class EventsCalendarService {
  private readonly logger = new Logger(EventsCalendarService.name);
  constructor(
    @InjectModel(EventsCalendar.name)
    private readonly eventsCalendarModel: Model<EventsCalendarDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createEventsCalendarDto: CreateEventsCalendarDto, userId: mongoose.Types.ObjectId): Promise<EventsCalendarDocument> {
    try {
      this.logger.debug('Creating event with DTO:', createEventsCalendarDto);
      this.logger.debug('User ID:', userId);

      const startDate = new Date(createEventsCalendarDto.startDate);
      let endDate: Date | undefined;

      if (createEventsCalendarDto.endDate) {
        endDate = new Date(createEventsCalendarDto.endDate);
      } else if (createEventsCalendarDto.duration) {
        // Calculate endDate based on startDate + duration (in minutes)
        endDate = new Date(startDate.getTime() + createEventsCalendarDto.duration * 60000);
      }
      
      const eventData: any = {
        title: createEventsCalendarDto.title,
        description: createEventsCalendarDto.description,
        location: createEventsCalendarDto.location,
        category: createEventsCalendarDto.category,
        duration: createEventsCalendarDto.duration,
        userId: userId,
        startDate: startDate,
        endDate: endDate,
        color: createEventsCalendarDto.color,
      };

      if (createEventsCalendarDto.recurrence) {
        eventData.recurrence = {
          ...createEventsCalendarDto.recurrence,
          endDate: createEventsCalendarDto.recurrence.endDate 
            ? new Date(createEventsCalendarDto.recurrence.endDate) 
            : undefined,
        };
        
      }

      const event = await this.eventsCalendarModel.create(eventData);
      this.eventEmitter.emit(EventsList.EVENT_CREATED, {userId: userId, eventId: event._id});
      return await event.populate('userId');
    }
    catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error creating event');
    }
  }

  async findAll(userId: mongoose.Types.ObjectId): Promise<EventsCalendarDocument[]> {
    try {
      return await this.eventsCalendarModel.find({userId: userId}).populate('userId');
    }
    catch (error) {
      throw new InternalServerErrorException('Error getting events');
    }
  }

  async findEventsInRange(
    userId: mongoose.Types.ObjectId, 
    startDate: Date, 
    endDate: Date
  ): Promise<EventsCalendarDocument[]> {
    try {
      // Ensure endDate includes the entire day
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
      if (isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid end date format');
      } 
      const inclusiveEndDate = new Date(endDate);
      inclusiveEndDate.setHours(23, 59, 59, 999);
      const baseEvents = await this.eventsCalendarModel
        .find({ 
          userId, 
          isRecurringInstance: { $ne: true }
        })
        .populate('userId');

      const allEvents: EventsCalendarDocument[] = [];

      for (const event of baseEvents) {
        if (event.recurrence && event.recurrence.frequency !== RecurrenceFrequency.NONE) {
          const recurringEvents = this.generateRecurringEvents(event, startDate, inclusiveEndDate);
          allEvents.push(...recurringEvents);
        } else {
          // Single event within range
          if (event.startDate >= startDate && event.startDate <= inclusiveEndDate) {
            allEvents.push(event);
          }
        }
      }

      return allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting events in range:', error);
      throw new InternalServerErrorException('Error getting events in range');
    }
  }

  private generateRecurringEvents(
    baseEvent: EventsCalendarDocument, 
    rangeStart: Date, 
    rangeEnd: Date
  ): EventsCalendarDocument[] {
    const events: EventsCalendarDocument[] = [];
    const recurrence = baseEvent.recurrence;
    
    if (!recurrence || recurrence.frequency === RecurrenceFrequency.NONE) {
      return [baseEvent];
    }

    let currentDate = new Date(baseEvent.startDate);
    let occurrenceCount = 0;
    
    // Calculate the effective end date based on both maxOccurrences and rangeEnd
    const maxDate = recurrence.endDate 
      ? new Date(Math.min(recurrence.endDate.getTime(), rangeEnd.getTime()))
      : rangeEnd;
    
    const maxOccurrences = recurrence.maxOccurrences || 100;

    // If the base event is before rangeStart, find the first occurrence within range
    if (currentDate < rangeStart) {
      while (currentDate < rangeStart && occurrenceCount < maxOccurrences) {
        currentDate = this.getNextOccurrenceDate(currentDate, recurrence);
        occurrenceCount++;
      }
    }

    // Generate events within the range
    while (currentDate <= maxDate && occurrenceCount < maxOccurrences) {
      if (this.shouldCreateOccurrence(currentDate, recurrence)) {
        const eventDuration = baseEvent.endDate 
          ? baseEvent.endDate.getTime() - baseEvent.startDate.getTime()
          : (baseEvent.duration || 0) * 60000;

        const occurrenceEvent = {
          ...baseEvent.toObject(),
          _id: new mongoose.Types.ObjectId(),
          startDate: new Date(currentDate),
          endDate: eventDuration > 0 ? new Date(currentDate.getTime() + eventDuration) : undefined,
          isRecurringInstance: true,
          parentEventId: baseEvent._id,
        } as EventsCalendarDocument;

        events.push(occurrenceEvent);
        occurrenceCount++;
      }

      currentDate = this.getNextOccurrenceDate(currentDate, recurrence);
    }

    return events;
  }

  private shouldCreateOccurrence(date: Date, recurrence: RecurrencePattern): boolean {
    if (recurrence.frequency === RecurrenceFrequency.WEEKLY && recurrence.daysOfWeek?.length) {
      const dayOfWeek = date.getDay();
      return recurrence.daysOfWeek.includes(dayOfWeek as DayOfWeek);
    }
    return true;
  }

  private getNextOccurrenceDate(currentDate: Date, recurrence: RecurrencePattern): Date {
    const nextDate = new Date(currentDate);
    const interval = recurrence.interval || 1;

    switch (recurrence.frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case RecurrenceFrequency.WEEKLY:
        if (recurrence.daysOfWeek?.length) {
          // Find next day in daysOfWeek
          let daysToAdd = 1;
          let nextDayOfWeek = (currentDate.getDay() + daysToAdd) % 7;
          
          while (!recurrence.daysOfWeek.includes(nextDayOfWeek as DayOfWeek)) {
            daysToAdd++;
            nextDayOfWeek = (currentDate.getDay() + daysToAdd) % 7;
            
            // If we've gone through a full week, add interval weeks
            if (daysToAdd > 7) {
              daysToAdd = ((interval - 1) * 7) + 1;
              nextDayOfWeek = (currentDate.getDay() + daysToAdd) % 7;
              while (!recurrence.daysOfWeek.includes(nextDayOfWeek as DayOfWeek)) {
                daysToAdd++;
                nextDayOfWeek = (currentDate.getDay() + daysToAdd) % 7;
              }
              break;
            }
          }
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else {
          nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
        break;
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<EventsCalendarDocument> {
    try {
      const event = await this.eventsCalendarModel.findById(id);
      if(!event) throw new NotFoundException('Event not found');
      if (!event.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      return await event.populate('userId');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting event');
    }
  }

  async update(id: mongoose.Types.ObjectId, updateEventsCalendarDto: UpdateEventsCalendarDto, userId: mongoose.Types.ObjectId): Promise<EventsCalendarDocument> {
    try {
      const event = await this.eventsCalendarModel.findById(id);
      if (!event) throw new NotFoundException('Event not found');
      if (!event.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      
      const updateData: any = {
        ...updateEventsCalendarDto,
      };

      // Handle date conversion
      if (updateEventsCalendarDto.startDate) {
        updateData.startDate = new Date(updateEventsCalendarDto.startDate);
      }
      if (updateEventsCalendarDto.endDate) {
        updateData.endDate = new Date(updateEventsCalendarDto.endDate);
      }

      // Handle recurrence pattern conversion
      if (updateEventsCalendarDto.recurrence) {
        updateData.recurrence = {
          ...updateEventsCalendarDto.recurrence,
          endDate: updateEventsCalendarDto.recurrence.endDate 
            ? new Date(updateEventsCalendarDto.recurrence.endDate) 
            : undefined,
        };
      }

      const event_upd = await this.eventsCalendarModel.findByIdAndUpdate(id, updateData, { new: true });
      return event_upd.populate('userId');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error updating event');
    }
  }

  async remove(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<EventsCalendarDocument> {
    try {
      const event = await this.eventsCalendarModel.findById(id);
      if (!event) throw new NotFoundException('Event not found');
      if (!event.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      const deletedEvent = await this.eventsCalendarModel.findByIdAndDelete(id);
      this.eventEmitter.emit(EventsList.EVENT_DELETED, {userId: userId, eventId: id});
      return deletedEvent;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting event');
    }
  }

  async getEventsCategory(userId: mongoose.Types.ObjectId, category: string): Promise<EventsCalendarDocument[]> {
    try {
      const events = await this.eventsCalendarModel.find({ userId, category }).populate('userId');
      if (!events) throw new NotFoundException('Events not found');
      return events;
    } catch (error) {
      throw new InternalServerErrorException('Error getting events');
    }
  }
}
