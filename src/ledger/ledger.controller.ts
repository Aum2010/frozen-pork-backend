import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common'
// import { Response } from 'express'
import { type Response } from 'express'
import { LedgerService } from './ledger.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { EventType } from '@prisma/client'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get()
  findAll(
    @Query('lotId') lotId?: string,
    @Query('eventType') eventType?: EventType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.findAll({ lotId, eventType, startDate, endDate })
  }

  @Roles('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN')
  @Get('lot/:lotId/timeline')
  getTimeline(@Param('lotId') lotId: string) {
    return this.ledgerService.getTimeline(lotId)
  }

  @Roles('MANAGER', 'ADMIN')
  @Get('export')
  async exportCsv(
    @Query('lotId') lotId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const csv = await this.ledgerService.exportCsv({ lotId, startDate, endDate })
    const filename = `ledger-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  }
}