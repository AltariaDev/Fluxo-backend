import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ParseMongoIdPipe } from "src/common/pipes/parse-mongo-id.pipe";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import mongoose from "mongoose";
import { User, UserDocument } from "./entities/user.entity";
import { GetUser } from "./decorators/get-user.decorator";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 400, description: "Invalid data provided" })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDocument>{
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all users" })
  @ApiResponse({
    status: 200,
    description: "List of users successfully retrieved",
  })
  async findAll(): Promise<UserDocument[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":term")
  @ApiOperation({ summary: "Find a user by ID, email, or username" })
  @ApiResponse({ status: 200, description: "User found successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("term") term: string): Promise<UserDocument> {
    return this.usersService.findOne(term);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user by ID" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 400, description: "Invalid data provided" })
  async update(
    @Param("id", ParseMongoIdPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    return this.usersService.update(id, updateUserDto);
  }

  @Get(":id/deletion-stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: "Get statistics of user-related data before deletion",
    description: "Returns count of all entities related to the user to understand deletion impact"
  })
  @ApiResponse({ 
    status: 200, 
    description: "User deletion statistics retrieved successfully",
    schema: {
      example: {
        user: {
          id: "507f1f77bcf86cd799439011",
          username: "johndoe",
          email: "john@example.com",
          createdAt: "2024-01-01T00:00:00.000Z"
        },
        relatedData: {
          tasks: 15,
          habits: 8,
          pomodoros: 25,
          events: 5,
          // ... other counts
        },
        summary: {
          totalOwnedEntities: 53,
          totalSharedEntities: 3,
          deletionImpact: "high"
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid user ID" })
  @ApiResponse({ status: 404, description: "User not found" })
  async getDeletionStats(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId) {
    return this.usersService.getUserDeletionStats(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: "Permanently delete a user and all related data",
    description: "This action cannot be undone. Deletes user and all associated data including tasks, habits, pomodoros, etc."
  })
  @ApiResponse({ 
    status: 200, 
    description: "User and all related data permanently deleted successfully",
    schema: {
      example: {
        message: "User and all related data successfully deleted",
        userId: "507f1f77bcf86cd799439011"
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid user ID or user not found" })
  @ApiResponse({ status: 500, description: "Internal server error during deletion" })
  async remove(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId) {
    return this.usersService.remove(id);
  }

  @Delete("delete/soft")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: "Soft delete a user by marking as deleted",
    description: "Marks user as deleted but preserves all data. Related entities will be cleaned up by scheduled cron job after retention period."
  })
  @ApiResponse({ 
    status: 200, 
    description: "User marked for deletion successfully",
    schema: {
      example: {
        message: "User successfully marked for deletion",
        userId: "507f1f77bcf86cd799439011",
        type: "soft_delete",
        deletedAt: "2024-01-15T10:30:00.000Z"
      }
    }
  })
  @ApiResponse({ status: 400, description: "Invalid user ID or user not found" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 500, description: "Internal server error during soft deletion" })
  async softDelete(@GetUser() user: UserDocument) {
    return this.usersService.softDelete(user.id);
  }
}