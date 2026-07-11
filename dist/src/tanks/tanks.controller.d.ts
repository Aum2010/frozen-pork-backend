import { TanksService } from './tanks.service';
import { FillTankDto } from './dto/fill-tank.dto';
import { WithdrawTankDto } from './dto/withdraw-tank.dto';
export declare class TanksController {
    private tanksService;
    constructor(tanksService: TanksService);
    findAll(): Promise<{
        isFifoNext: boolean;
        tankEntries: ({
            thawEvent: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            weightKg: number;
            thawEventId: string;
            emptyAt: Date | null;
            filledAt: Date;
            tankId: string;
        })[];
        id: string;
        tankNumber: number;
        capacityKg: number;
        currentWeightKg: number;
        status: import(".prisma/client").$Enums.TankStatus;
        updatedAt: Date;
    }[]>;
    getFifoSuggest(): Promise<{
        tankEntries: ({
            thawEvent: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            weightKg: number;
            thawEventId: string;
            emptyAt: Date | null;
            filledAt: Date;
            tankId: string;
        })[];
    } & {
        id: string;
        tankNumber: number;
        capacityKg: number;
        currentWeightKg: number;
        status: import(".prisma/client").$Enums.TankStatus;
        updatedAt: Date;
    }>;
    fill(tankId: string, dto: FillTankDto, user: any): Promise<{
        id: string;
        tankNumber: number;
        capacityKg: number;
        currentWeightKg: number;
        status: import(".prisma/client").$Enums.TankStatus;
        updatedAt: Date;
    } | null>;
    withdraw(tankId: string, dto: WithdrawTankDto, user: any): Promise<{
        id: string;
        tankNumber: number;
        capacityKg: number;
        currentWeightKg: number;
        status: import(".prisma/client").$Enums.TankStatus;
        updatedAt: Date;
    } | null>;
    withdrawAuto(dto: WithdrawTankDto, user: any): Promise<{
        totalWeightKg: number;
        plan: {
            tankNumber: number;
            weightKg: number;
        }[];
    }>;
}
