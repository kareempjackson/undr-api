import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Creators')
@Controller('creators')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreatorsController {
  constructor(private creatorsService: CreatorsService) {}

  @Get('dashboard')
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Get creator dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Request() req) {
    return this.creatorsService.getDashboard(req.user.sub);
  }

  @Get('earnings')
  @Roles('CREATOR')
  @ApiOperation({ summary: 'Get creator earnings data' })
  @ApiResponse({ status: 200, description: 'Earnings data retrieved successfully' })
  async getEarnings(@Request() req) {
    return this.creatorsService.getEarnings(req.user.sub);
  }
} 