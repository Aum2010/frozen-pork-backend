import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'

// const DAILY_USAGE_KG = 800      // 1-2 ถัง × 400 กก.
let dailyUsageKg = 800
const LEAD_TIME_DAYS = 3
const THAW_LEAD_TIME_DAYS = 1

@Injectable()
export class SmartAdvisoryService {
  private readonly logger = new Logger(SmartAdvisoryService.name)

  constructor(private prisma: PrismaService) { }

  // ── Cron Jobs ─────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async cronReorderCheck() {
    this.logger.log('[Cron] ตรวจสอบ reorder point...')
    const result = await this.checkReorderPoint()
    if (result.shouldReorder) {
      this.logger.warn(`[Alert] สต็อกวิกฤต! เหลือ ${result.totalStockKg} กก. = ${result.daysLeft} วัน — ควรสั่งซื้อด่วน`)
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cronThawReminder() {
    this.logger.log('[Cron] ตรวจสอบการละลาย...')
    const result = await this.checkThawReminder()
    if (result.shouldThaw) {
      this.logger.warn(`[Alert] ควรนำหมู ${result.recommendedWeightKg} กก. ออกมาละลายวันนี้`)
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cronTankReady() {
    this.logger.log('[Cron] ตรวจสอบหมูพร้อมเข้าถัง...')
    const result = await this.checkTankReady()
    if (result.readyCount > 0) {
      this.logger.warn(`[Alert] มีหมู ${result.readyCount} รายการพร้อมเข้าถัง`)
    }
  }

  // ── Core Logic ────────────────────────────────────────

  async checkReorderPoint() {
    const lots = await this.prisma.lot.findMany({
      where: {
        status: { in: ['IN_FREEZER', 'PARTIALLY_THAWING', 'FULLY_THAWING'] },
        remainingKg: { gt: 0 },
      },
    })

    // const totalStockKg = lots.reduce((sum, l) => sum + l.weightKg, 0)
    const totalStockKg = lots.reduce((sum, l) => sum + l.remainingKg, 0)

    if (dailyUsageKg === 0) {
      return { shouldReorder: false, totalStockKg, daysLeft: Infinity, recommendedOrderKg: 0 }
    }

    const daysLeft = Math.floor(totalStockKg / dailyUsageKg)
    const shouldReorder = daysLeft <= LEAD_TIME_DAYS

    return {
      shouldReorder,
      totalStockKg,
      daysLeft,
      recommendedOrderKg: shouldReorder ? 4000 : 0,
      message: shouldReorder
        ? `สต็อกเหลือ ${daysLeft} วัน — ควรสั่งซื้อ 4,000 กก. ด่วน`
        : `สต็อกเพียงพอ ${daysLeft} วัน`,
    }
  }

  async checkThawReminder() {
    // หาน้ำหนักที่กำลังละลายอยู่
    const thawing = await this.prisma.thawEvent.findMany({
      where: { status: 'THAWING' },
    })
    const thawingKg = thawing.reduce((sum, e) => sum + e.weightKg, 0)

    // ต้องการพรุ่งนี้ = DAILY_USAGE_KG
    const neededKg = dailyUsageKg
    const shouldThaw = thawingKg < neededKg
    const recommendedWeightKg = Math.max(0, neededKg - thawingKg)

    return {
      shouldThaw,
      thawingKg,
      neededKg,
      recommendedWeightKg,
      message: shouldThaw
        ? `ควรนำหมู ${recommendedWeightKg} กก. ออกมาละลายวันนี้`
        : `กำลังละลาย ${thawingKg} กก. เพียงพอแล้ว`,
    }
  }

  async checkTankReady() {
    const now = new Date()
    const readyEvents = await this.prisma.thawEvent.findMany({
      where: {
        status: 'THAWING',
        readyAt: { lte: now },
      },
      include: { lot: true },
    })

    return {
      readyCount: readyEvents.length,
      readyEvents,
      message: readyEvents.length > 0
        ? `มีหมู ${readyEvents.length} รายการพร้อมเข้าถัง`
        : 'ไม่มีหมูรอเข้าถัง',
    }
  }

  // ── Summary (สำหรับ Dashboard) ────────────────────────

  async getStatus() {
    const [reorder, thaw, tankReady, expiry] = await Promise.all([
      this.checkReorderPoint(),
      this.checkThawReminder(),
      this.checkTankReady(),
      this.checkExpiry(),  // เพิ่ม
    ])

    return {
      reorder,
      thaw,
      tankReady,
      expiry,  // เพิ่ม
      hasAlert: reorder.shouldReorder || thaw.shouldThaw ||
        tankReady.readyCount > 0 || expiry.expiredCount > 0 || expiry.warningCount > 0,
    }
  }

  async checkExpiry() {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const expiringSoon = await this.prisma.lot.findMany({
      where: {
        expiryDate: { lte: in7Days },
        remainingKg: { gt: 0 },        // เพิ่ม — เฉพาะที่ยังมีของ
        status: { notIn: ['USED'] },
      },
      orderBy: { expiryDate: 'asc' },
    })

    const expired = expiringSoon.filter(
      (l) => l.expiryDate && l.expiryDate < now
    )

    const warning = expiringSoon.filter(
      (l) => l.expiryDate && l.expiryDate >= now
    )

    return {
      expiredCount: expired.length,
      warningCount: warning.length,
      expired,
      warning,
      message: expired.length > 0
        ? `⚠️ มีหมูหมดอายุแล้ว ${expired.length} lot`
        : warning.length > 0
          ? `หมูใกล้หมดอายุ ${warning.length} lot (ภายใน 7 วัน)`
          : 'ไม่มีหมูใกล้หมดอายุ',
    }
  }
}