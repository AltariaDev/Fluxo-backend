// import { Controller, Get, Param, UseGuards } from '@nestjs/common';
// import { DashboardService } from './dashboard.service';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { GetUser } from 'src/users/decorators/get-user.decorator';
// import { User } from 'src/users/entities/user.entity';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
// import mongoose from 'mongoose';
// import { Public } from 'src/auth/decorators/public.decorator';

// @ApiTags('Dashboard')
// @Controller('dashboard')
// export class DashboardController {
//   constructor(private readonly dashboardService: DashboardService) {}

//   @Get()
//   @ApiOperation({ summary: 'Get personal dashboard data for current user' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Returns personal dashboard data including tasks, habits, and pomodoro statistics' 
//   })
//   async getUserDashboard(@GetUser() user: User) {
//     return this.dashboardService.getUserDashboard(user.id);
//   }

//   @Get('global')
//   @Public()
//   @ApiOperation({ summary: 'Get global dashboard data for all users' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Returns global dashboard data for all users' 
//   })
//   async getGlobalDashboard() {
//     return this.dashboardService.getGlobalDashboard();
//   }

//   @Get('user/:userId')
//   @ApiOperation({ summary: 'Get dashboard data for a specific user' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Returns dashboard data for a specific user' 
//   })
//   async getSpecificUserDashboard(@Param('userId', ParseMongoIdPipe) userId: mongoose.Types.ObjectId) {
//     return this.dashboardService.getSpecificUserDashboard(userId);
//   }

//   @Get('stats/week')
//   @ApiOperation({ summary: 'Get user statistics for the current week' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Returns weekly statistics for the current user' 
//   })
//   async getWeeklyStats(@GetUser() user: User) {
//     // TODO: Por hacer
//     return { message: 'Weekly stats endpoint - to be implemented' };
//   }

//   @Get('stats/month')
//   @ApiOperation({ summary: 'Get user statistics for the current month' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Returns monthly statistics for the current user' 
//   })
//   async getMonthlyStats(@GetUser() user: User) {
//     // TODO: Por hacer
//     return { message: 'Monthly stats endpoint - to be implemented' };
//   }
// }