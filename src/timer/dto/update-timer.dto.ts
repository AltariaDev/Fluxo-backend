import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { StartTimerDto } from "./start-timer.dto";
import { IsBoolean, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, Min } from "class-validator";
import mongoose from "mongoose";

export class UpdateTimerDto extends PartialType(StartTimerDto) {
  @ApiPropertyOptional({
    example: false,
    description: "Indicates if the timer is running or paused",
  })
  @IsOptional()
  @IsBoolean()
  isRunning?: boolean;

  @ApiPropertyOptional({
    example: 120,
    description: "Elapsed time in seconds",
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Elapsed time must be a positive number" })
  elapsedTime?: number;

  @ApiPropertyOptional({
    example: "2021-03-28T17:00:00.000Z",
    description: "End time of the timer",
  })
  @IsOptional()
  endTime?: Date;

  @ApiPropertyOptional({
    example: "completed",
    description: "Status of the timer",
    enum: ["pending", "completed", "cancelled"],
  })
  @IsOptional()
  @IsEnum(["pending", "completed", "cancelled"])
  status?: "pending" | "completed" | "cancelled";

  @ApiPropertyOptional({
    example: "Finished the calculus problems",
    description: "Notes about the timer session",
  })
  @IsOptional()
  @IsString()
  notes?: string;

}
