import { PrismaService } from '../../prisma/prisma.service';
import { CreateThawDto } from './dto/create-thaw.dto';
export declare class ThawService {
    private prisma;
    constructor(prisma: PrismaService);
    startThaw(dto: CreateThawDto, actorId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ThawStatus;
        createdAt: Date;
        weightKg: number;
        remainingKg: number;
        lotId: string;
        startedAt: Date;
        readyAt: Date;
        confirmedBy: string;
    }>;
    getPending(): Promise<{
        remainingMinutes: number;
        isOverdue: boolean;
        lot: {
            id: string;
            status: import(".prisma/client").$Enums.LotStatus;
            createdAt: Date;
            lotNumber: string;
            supplier: string;
            weightKg: number;
            receivedAt: Date;
            zone: string | null;
            batchId: string;
            remainingKg: number;
        };
        id: string;
        status: import(".prisma/client").$Enums.ThawStatus;
        createdAt: Date;
        weightKg: number;
        remainingKg: number;
        lotId: string;
        startedAt: Date;
        readyAt: Date;
        confirmedBy: string;
    }[]>;
    confirmReady(thawEventId: string, actorId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ThawStatus;
        createdAt: Date;
        weightKg: number;
        remainingKg: number;
        lotId: string;
        startedAt: Date;
        readyAt: Date;
        confirmedBy: string;
    } | null>;
    patchReadyAt(thawEventId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ThawStatus;
        createdAt: Date;
        weightKg: number;
        remainingKg: number;
        lotId: string;
        startedAt: Date;
        readyAt: Date;
        confirmedBy: string;
    }>;
    getWaitingTank(): Promise<({
        lot: {
            id: string;
            status: import(".prisma/client").$Enums.LotStatus;
            createdAt: Date;
            lotNumber: string;
            supplier: string;
            weightKg: number;
            receivedAt: Date;
            zone: string | null;
            batchId: string;
            remainingKg: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ThawStatus;
        createdAt: Date;
        weightKg: number;
        remainingKg: number;
        lotId: string;
        startedAt: Date;
        readyAt: Date;
        confirmedBy: string;
    })[]>;
    startThawAuto(totalWeightKg: number, actorId: string): Promise<{
        totalWeightKg: number;
        plan: {
            lot: string;
            weightKg: number;
        }[];
        thawEvents: {
            id: string;
            lotId: string;
            weightKg: number;
            remainingKg: number;
            startedAt: Date;
            readyAt: Date;
            confirmedBy: string;
            status: string;
            createdAt: Date;
        }[];
    }>;
}
