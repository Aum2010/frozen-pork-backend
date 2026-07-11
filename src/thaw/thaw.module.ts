import { Module } from '@nestjs/common'
import { ThawService } from './thaw.service'
import { ThawController } from './thaw.controller'

@Module({
  controllers: [ThawController],
  providers: [ThawService],
  exports: [ThawService],
})
export class ThawModule {}