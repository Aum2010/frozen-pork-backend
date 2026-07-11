import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
// import { PrismaService } from '../src/prisma/prisma.service'
import { PrismaService } from '../../prisma/prisma.service'

export async function createTestApp(): Promise<{
  app: INestApplication
  prisma: PrismaService
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.init()

  const prisma = app.get(PrismaService)
  return { app, prisma }
}