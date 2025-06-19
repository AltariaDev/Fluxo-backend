import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString, MinLength } from "class-validator";
import mongoose from "mongoose";

export class StartTimerDto {
  @ApiProperty({
    example: "Studying Math",
    description: "Timer title or activity name",
  })
  @IsString()
  @MinLength(3, { message: "Timer name must be at least 3 characters long" })
  title: string;

  @ApiProperty({
    example: "605f3a6e9b0f4c001f9d2c5b",
    description: "Optional task ID to associate with this timer",
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  task?: mongoose.Types.ObjectId;

  @ApiProperty({
    example: "Working on calculus problems",
    description: "Optional notes about this timer session",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
