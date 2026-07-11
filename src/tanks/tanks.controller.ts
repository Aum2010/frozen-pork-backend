import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { TanksService } from './tanks.service'
import { FillTankDto } from './dto/fill-tank.dto'
import { WithdrawTankDto } from './dto/withdraw-tank.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tanks')
export class TanksController {
  constructor(private tanksService: TanksService) { }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get()
  findAll() {
    return this.tanksService.findAll()
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('fifo-suggest')
  getFifoSuggest() {
    return this.tanksService.getFifoSuggest()
  }

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Post(':tankId/fill')
  fill(
    @Param('tankId') tankId: string,
    @Body() dto: FillTankDto,
    @CurrentUser() user: any,
  ) {
    return this.tanksService.fill(tankId, dto, user.id)
  }

  @Roles('PRODUCTION', 'MANAGER', 'ADMIN')
  @Post(':tankId/withdraw')
  withdraw(
    @Param('tankId') tankId: string,
    @Body() dto: WithdrawTankDto,
    @CurrentUser() user: any,
  ) {
    return this.tanksService.withdraw(tankId, dto, user.id)
  }

  @Roles('PRODUCTION', 'MANAGER', 'ADMIN')
  @Post('withdraw-auto')
  withdrawAuto(@Body() dto: WithdrawTankDto, @CurrentUser() user: any) {
    return this.tanksService.withdrawAuto(dto, user.id)
  }
}