import { Controller, Get, UseGuards } from '@nestjs/common'
import { SmartAdvisoryService } from './smart-advisory.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('advisory')
export class SmartAdvisoryController {
  constructor(private advisoryService: SmartAdvisoryService) {}

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('status')
  getStatus() {
    return this.advisoryService.getStatus()
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('reorder')
  checkReorder() {
    return this.advisoryService.checkReorderPoint()
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('thaw-reminder')
  checkThaw() {
    return this.advisoryService.checkThawReminder()
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('tank-ready')
  checkTankReady() {
    return this.advisoryService.checkTankReady()
  }
}