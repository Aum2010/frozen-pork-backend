import { PrismaService } from '../../prisma/prisma.service';
export declare class SmartAdvisoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    cronReorderCheck(): Promise<void>;
    cronThawReminder(): Promise<void>;
    cronTankReady(): Promise<void>;
    checkReorderPoint(): Promise<{
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
    checkThawReminder(): Promise<{
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
        })[];
        message: string;
    }>;
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
            })[];
            message: string;
        };
        expiry: {
            expiredCount: number;
            warningCount: number;
            expired: {
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
            }[];
            warning: {
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
            }[];
            message: string;
        };
        hasAlert: boolean;
    }>;
    checkExpiry(): Promise<{
        expiredCount: number;
        warningCount: number;
        expired: {
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
        }[];
        warning: {
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
        }[];
        message: string;
    }>;
}
