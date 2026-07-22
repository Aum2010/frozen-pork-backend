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
                lotNumber: string;
                batchId: string;
                supplier: string;
                weightKg: number;
                remainingKg: number;
                zone: string | null;
                status: import(".prisma/client").$Enums.LotStatus;
                expiryDate: Date | null;
                receivedAt: Date;
                createdAt: Date;
            };
        } & {
            id: string;
            weightKg: number;
            remainingKg: number;
            status: import(".prisma/client").$Enums.ThawStatus;
            createdAt: Date;
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
                    lotNumber: string;
                    batchId: string;
                    supplier: string;
                    weightKg: number;
                    remainingKg: number;
                    zone: string | null;
                    status: import(".prisma/client").$Enums.LotStatus;
                    expiryDate: Date | null;
                    receivedAt: Date;
                    createdAt: Date;
                };
            } & {
                id: string;
                weightKg: number;
                remainingKg: number;
                status: import(".prisma/client").$Enums.ThawStatus;
                createdAt: Date;
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
                lotNumber: string;
                batchId: string;
                supplier: string;
                weightKg: number;
                remainingKg: number;
                zone: string | null;
                status: import(".prisma/client").$Enums.LotStatus;
                expiryDate: Date | null;
                receivedAt: Date;
                createdAt: Date;
            }[];
            warning: {
                id: string;
                lotNumber: string;
                batchId: string;
                supplier: string;
                weightKg: number;
                remainingKg: number;
                zone: string | null;
                status: import(".prisma/client").$Enums.LotStatus;
                expiryDate: Date | null;
                receivedAt: Date;
                createdAt: Date;
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
            lotNumber: string;
            batchId: string;
            supplier: string;
            weightKg: number;
            remainingKg: number;
            zone: string | null;
            status: import(".prisma/client").$Enums.LotStatus;
            expiryDate: Date | null;
            receivedAt: Date;
            createdAt: Date;
        }[];
        warning: {
            id: string;
            lotNumber: string;
            batchId: string;
            supplier: string;
            weightKg: number;
            remainingKg: number;
            zone: string | null;
            status: import(".prisma/client").$Enums.LotStatus;
            expiryDate: Date | null;
            receivedAt: Date;
            createdAt: Date;
        }[];
        message: string;
    }>;
}
