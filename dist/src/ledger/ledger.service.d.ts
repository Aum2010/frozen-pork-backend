import { PrismaService } from '../../prisma/prisma.service';
import { EventType } from '@prisma/client';
export declare class LedgerService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters: {
        lotId?: string;
        eventType?: EventType;
        startDate?: string;
        endDate?: string;
    }): Promise<({
        lot: {
            id: string;
            status: import(".prisma/client").$Enums.LotStatus;
            createdAt: Date;
            lotNumber: string;
            supplier: string;
            weightKg: number;
            receivedAt: Date;
            expiryDate: Date | null;
            zone: string | null;
            batchId: string;
            remainingKg: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        weightKg: number;
        eventType: import(".prisma/client").$Enums.EventType;
        actorId: string;
        productionOrder: string | null;
        note: string | null;
        lotId: string | null;
        thawEventId: string | null;
        tankEntryId: string | null;
    })[]>;
    getTimeline(lotId: string): Promise<{
        lot: {
            id: string;
            status: import(".prisma/client").$Enums.LotStatus;
            createdAt: Date;
            lotNumber: string;
            supplier: string;
            weightKg: number;
            receivedAt: Date;
            expiryDate: Date | null;
            zone: string | null;
            batchId: string;
            remainingKg: number;
        };
        timeline: {
            step: string;
            label: string;
            date: Date;
            weightKg: number;
            detail: string;
        }[];
    }>;
    exportCsv(filters: {
        lotId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<string>;
}
