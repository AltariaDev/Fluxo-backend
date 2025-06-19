import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  MinDate,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateReminderDto {
  @ApiProperty({ description: "Reminder title", example: "law exam" })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: "Additional description for the reminder",
    example: "Study chapter 4 and 5",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Date and time of the reminder",
    example: "2025-02-15T10:00:00.000Z",
  })
  @IsDateString()
  @MinDate(new Date())
  date: string;

  @ApiPropertyOptional({
    description: "Reminder status",
    enum: ["active", "completed", "cancelled"],
    example: "active",
  })
  @IsOptional()
  @IsEnum(["active", "completed", "cancelled"])
  status?: string;

  @ApiPropertyOptional({
    description: "Indicates if the reminder repeats",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  repeat?: boolean;

  @ApiPropertyOptional({
    description: "Repeat interval for the reminder",
    enum: ["daily", "weekly", "monthly"],
    example: "weekly",
  })
  @IsOptional()
  @IsEnum(["daily", "weekly", "monthly"])
  repeatInterval?: string;
}
