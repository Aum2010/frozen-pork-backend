import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common'
import { ThawService } from './thaw.service'
import { CreateThawDto } from './dto/create-thaw.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { StartThawAutoDto } from './dto/start-thaw-auto.dto'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('thaw')
export class ThawController {
  constructor(private thawService: ThawService) { }

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Post()
  startThaw(@Body() dto: CreateThawDto, @CurrentUser() user: any) {
    return this.thawService.startThaw(dto, user.id)
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('pending')
  getPending() {
    return this.thawService.getPending()
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('waiting-tank')
  getWaitingTank() {
    return this.thawService.getWaitingTank()
  }

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Post(':id/confirm-ready')
  confirmReady(@Param('id') id: string, @CurrentUser() user: any) {
    return this.thawService.confirmReady(id, user.id)
  }

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Post('auto')
  startThawAuto(@Body() dto: StartThawAutoDto, @CurrentUser() user: any) {
    return this.thawService.startThawAuto(dto.totalWeightKg, user.id)
  }
}