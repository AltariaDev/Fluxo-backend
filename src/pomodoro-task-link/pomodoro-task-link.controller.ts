import { Controller, Delete, Param, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PomodoroTaskLinkService } from './pomodoro-task-link.service';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import mongoose from 'mongoose';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@ApiTags('Pomodoro Task Link')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@Controller('pomodoro-task-link')
export class PomodoroTaskLinkController {
  constructor(private readonly pomodoroTaskLinkService: PomodoroTaskLinkService) {}


  @Post(':pomodoroId/link/:taskId')
  @ApiOperation({ summary: 'Link a pomodoro to a task' })
  @ApiResponse({ status: 200, description: 'Pomodoro linked to task' })
  @ApiResponse({ status: 404, description: 'Pomodoro or task not found' })
  async link(@Param('pomodoroId', ParseMongoIdPipe) pomodoroId: mongoose.Types.ObjectId, @Param('taskId', ParseMongoIdPipe) taskId: mongoose.Types.ObjectId) {
    await this.pomodoroTaskLinkService.linkPomodoroToTask(
      pomodoroId,
      taskId,
    );
  }

  @Delete(':pomodoroId/unlink')
  @ApiOperation({ summary: 'Unlink a pomodoro from a task' })
  @ApiResponse({ status: 200, description: 'Pomodoro unlinked from task' })
  @ApiResponse({ status: 404, description: 'Pomodoro or task not found' })
  async unlink(@Param('pomodoroId', ParseMongoIdPipe) pomodoroId: mongoose.Types.ObjectId) {
    await this.pomodoroTaskLinkService.unlinkPomodoroFromTask(pomodoroId);
  }
}
