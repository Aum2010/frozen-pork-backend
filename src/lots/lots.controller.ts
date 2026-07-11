import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { LotsService } from './lots.service'
import { CreateLotDto } from './dto/create-lot.dto'
import { AssignZoneDto } from './dto/assign-zone.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { LotStatus } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lots')
export class LotsController {
  constructor(private lotsService: LotsService) {}

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateLotDto, @CurrentUser() user: any) {
    return this.lotsService.create(dto, user.id)
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get()
  findAll(@Query('status') status?: LotStatus) {
    return this.lotsService.findAll(status)
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lotsService.findOne(id)
  }

  @Roles('WAREHOUSE', 'MANAGER', 'ADMIN')
  @Patch(':id/zone')
  assignZone(
    @Param('id') id: string,
    @Body() dto: AssignZoneDto,
    @CurrentUser() user: any,
  ) {
    return this.lotsService.assignZone(id, dto, user.id)
  }
}