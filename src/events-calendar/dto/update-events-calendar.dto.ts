import { PartialType } from '@nestjs/swagger';
import { CreateEventsCalendarDto } from './create-events-calendar.dto';

export class UpdateEventsCalendarDto extends PartialType(CreateEventsCalendarDto) {}
