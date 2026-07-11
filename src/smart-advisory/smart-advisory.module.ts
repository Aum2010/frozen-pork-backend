import { Module } from '@nestjs/common'
import { SmartAdvisoryService } from './smart-advisory.service'
import { SmartAdvisoryController } from './smart-advisory.controller'

@Module({
  controllers: [SmartAdvisoryController],
  providers: [SmartAdvisoryService],
  exports: [SmartAdvisoryService],
})
export class SmartAdvisoryModule {}