import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './../prisma/prisma.module'

import { AuthModule } from './auth/auth.module';
import { LotsModule } from './lots/lots.module';
import { ThawModule } from './thaw/thaw.module';
import { TanksModule } from './tanks/tanks.module';
import { SmartAdvisoryModule } from './smart-advisory/smart-advisory.module';
import { LedgerModule } from './ledger/ledger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LotsModule,
    ThawModule,
    TanksModule,
    SmartAdvisoryModule,
    LedgerModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}