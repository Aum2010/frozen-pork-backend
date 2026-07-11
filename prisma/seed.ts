import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const hash = (pw: string) => bcrypt.hash(pw, 10)

  await prisma.user.createMany({
    data: [
      { email: 'warehouse@test.com', password: await hash('1234'), name: 'สมชาย โกดัง', role: 'WAREHOUSE' },
      { email: 'production@test.com', password: await hash('1234'), name: 'วิไล ผลิต', role: 'PRODUCTION' },
      { email: 'manager@test.com', password: await hash('1234'), name: 'ผู้จัดการ', role: 'MANAGER' },
      { email: 'admin@test.com', password: await hash('1234'), name: 'Admin', role: 'ADMIN' },
    ],
    skipDuplicates: true,
  })

  for (let i = 1; i <= 6; i++) {
    await prisma.tank.upsert({
      where: { tankNumber: i },
      update: {},
      create: { tankNumber: i, capacityKg: 400 },
    })
  }

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())