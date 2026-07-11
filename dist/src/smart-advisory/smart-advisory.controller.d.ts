import { SmartAdvisoryService } from './smart-advisory.service';
export declare class SmartAdvisoryController {
    private advisoryService;
    constructor(advisoryService: SmartAdvisoryService);
    getStatus(): Promise<{
        reorder: {
            shouldReorder: boolean;
            totalStockKg: number;
            daysLeft: number;
            recommendedOrderKg: number;
            message?: undefined;
        } | {
            shouldReorder: boolean;
            totalStockKg: number;
            daysLeft: number;
            recommendedOrderKg: number;
            message: string;
        };
        thaw: {
            shouldThaw: boolean;
            thawingKg: number;
            neededKg: number;
            recommendedWeightKg: number;
            message: string;
        };
        tankReady: {
            readyCount: number;
            readyEvents: ({
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
            })[];
            message: string;
        };
        hasAlert: boolean;
    }>;
    checkReorder(): Promise<{
        shouldReorder: boolean;
        totalStockKg: number;
        daysLeft: number;
        recommendedOrderKg: number;
        message?: undefined;
    } | {
        shouldReorder: boolean;
        totalStockKg: number;
        daysLeft: number;
        recommendedOrderKg: number;
        message: string;
    }>;
    checkThaw(): Promise<{
        shouldThaw: boolean;
        thawingKg: number;
        neededKg: number;
        recommendedWeightKg: number;
        message: string;
    }>;
    checkTankReady(): Promise<{
        readyCount: number;
        readyEvents: ({
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
        })[];
        message: string;
    }>;
}
