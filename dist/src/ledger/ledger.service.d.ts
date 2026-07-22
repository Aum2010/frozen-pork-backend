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
            weightKg: number;
            createdAt: Date;
            lotNumber: string;
            batchId: string;
            supplier: string;
            remainingKg: number;
            zone: string | null;
            status: import(".prisma/client").$Enums.LotStatus;
            expiryDate: Date | null;
            receivedAt: Date;
        } | null;
    } & {
        id: string;
        eventType: import(".prisma/client").$Enums.EventType;
        lotId: string | null;
        thawEventId: string | null;
        tankEntryId: string | null;
        weightKg: number;
        actorId: string;
        productionOrder: string | null;
        note: string | null;
        createdAt: Date;
    })[]>;
    getTimeline(lotId: string): Promise<{
        lot: {
            id: string;
            weightKg: number;
            createdAt: Date;
            lotNumber: string;
            batchId: string;
            supplier: string;
            remainingKg: number;
            zone: string | null;
            status: import(".prisma/client").$Enums.LotStatus;
            expiryDate: Date | null;
            receivedAt: Date;
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
