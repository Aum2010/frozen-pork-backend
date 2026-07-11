import { LotsService } from './lots.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { AssignZoneDto } from './dto/assign-zone.dto';
import { LotStatus } from '@prisma/client';
export declare class LotsController {
    private lotsService;
    constructor(lotsService: LotsService);
    create(dto: CreateLotDto, user: any): Promise<{
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
    }>;
    findAll(status?: LotStatus): Promise<({
        thawEvents: {
            id: string;
            status: import(".prisma/client").$Enums.ThawStatus;
            createdAt: Date;
            weightKg: number;
            remainingKg: number;
            lotId: string;
            startedAt: Date;
            readyAt: Date;
            confirmedBy: string;
        }[];
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        thawEvents: {
            id: string;
            status: import(".prisma/client").$Enums.ThawStatus;
            createdAt: Date;
            weightKg: number;
            remainingKg: number;
            lotId: string;
            startedAt: Date;
            readyAt: Date;
            confirmedBy: string;
        }[];
        ledgers: {
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
        }[];
    } & {
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
    }>;
    assignZone(id: string, dto: AssignZoneDto, user: any): Promise<{
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
    }>;
}
