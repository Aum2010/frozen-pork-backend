import { ThawService } from './thaw.service';
import { CreateThawDto } from './dto/create-thaw.dto';
import { StartThawAutoDto } from './dto/start-thaw-auto.dto';
export declare class ThawController {
    private thawService;
    constructor(thawService: ThawService);
    startThaw(dto: CreateThawDto, user: any): Promise<{
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
            expiryDate: Date | null;
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
    getWaitingTank(): Promise<({
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
    confirmReady(id: string, user: any): Promise<{
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
    startThawAuto(dto: StartThawAutoDto, user: any): Promise<{
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
