import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsNumber, IsEnum, IsArray, IsBoolean, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { RecurrenceFrequency, DayOfWeek } from "../entities/events-calendar.entity";

// Export for use in other DTOs
export { RecurrenceFrequency, DayOfWeek } from "../entities/events-calendar.entity";

export class RecurrencePatternDto {
  @ApiProperty({
    example: RecurrenceFrequency.WEEKLY,
    description: "Frequency of recurrence",
    enum: RecurrenceFrequency,
  })
  @IsEnum(RecurrenceFrequency)
  readonly frequency: RecurrenceFrequency;

  @ApiProperty({
    example: 1,
    description: "Interval between recurrences (e.g., every 2 weeks)",
  })
  @IsNumber()
  @IsOptional()
  readonly interval?: number;

  @ApiProperty({
    example: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
    description: "Days of the week for weekly recurrence",
    enum: DayOfWeek,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @IsOptional()
  readonly daysOfWeek?: DayOfWeek[];

  @ApiProperty({
    example: "2024-12-31T23:59:59Z",
    description: "End date for recurrence",
  })
  @IsString()
  @IsOptional()
  readonly endDate?: string;

  @ApiProperty({
    example: 10,
    description: "Maximum number of occurrences",
  })
  @IsNumber()
  @IsOptional()
  readonly maxOccurrences?: number;
}

export class CreateEventsCalendarDto {
  @ApiProperty({
    example: "Meeting",
    description: "Event title",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(25)
  readonly title: string;

  @ApiProperty({
    example: "Meeting with the team",
    description: "Event description",
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "Office",
    description: "Event location",
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  readonly location?: string;

  @ApiProperty({ description: 'Start Date of the Task', example: '2025-02-24T00:00:00Z' })
  @IsString()
  readonly startDate: string;

  @ApiProperty({ description: 'End Date of the Task', example: '2025-02-28T23:59:59Z' })
  @IsOptional()
  @IsString()
  readonly endDate?: string;

  @ApiProperty({ description: 'Duration of the Task (minutes)', example: 1 })
  @IsOptional()
  @IsNumber()
  readonly duration?: number;

  @ApiProperty({
    example: "General",
    description: "Event category",
  })
  @IsString()
  @IsOptional()
  @MaxLength(25)
  readonly category?: string;

  @ApiProperty({
    description: "Recurrence pattern for repeating events",
    type: RecurrencePatternDto,
  })
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  @IsOptional()
  readonly recurrence?: RecurrencePatternDto;

  @ApiProperty({
    description: "Color of the event",
    example: "#000000",
  })
  @IsString()
  @IsOptional()
  readonly color?: string;
}
