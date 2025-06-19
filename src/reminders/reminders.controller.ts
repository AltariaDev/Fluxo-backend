import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { RemindersService } from "./reminders.service";
import { CreateReminderDto, UpdateReminderDto } from "./dto/index";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetUser } from "src/users/decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";
import { ParseMongoIdPipe } from "src/common/pipes/parse-mongo-id.pipe";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtPayload } from "src/auth/interfaces/jwt-payload.interface";
import mongoose from "mongoose";

@ApiTags("Reminders")
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@Controller("reminders")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new reminder" })
  @ApiResponse({ status: 201, description: "Reminder successfully created" })
  @ApiResponse({ status: 400, description: "Invalid data provided" })
  create(@Body() createReminderDto: CreateReminderDto, @GetUser() user: User) {
    return this.remindersService.create(createReminderDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all reminders of the authenticated user" })
  @ApiResponse({ status: 200, description: "List of reminders retrieved" })
  findAll(@GetUser() user: User) {
    return this.remindersService.findAll(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a specific reminder by ID" })
  @ApiResponse({ status: 200, description: "Reminder retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  @ApiResponse({ status: 404, description: "Reminder not found" })
  findOne(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User) {
    return this.remindersService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a reminder by ID" })
  @ApiResponse({ status: 200, description: "Reminder updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid data provided" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  @ApiResponse({ status: 404, description: "Reminder not found" })
  update(
    @Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId,
    @Body() updateReminderDto: UpdateReminderDto,
    @GetUser() user: User,
  ) {
    return this.remindersService.update(
      id,
      user.id,
      updateReminderDto,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a reminder by ID" })
  @ApiResponse({ status: 200, description: "Reminder deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  @ApiResponse({ status: 404, description: "Reminder not found" })
  remove(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User) {
    return this.remindersService.remove(id, user.id);
  }
}
