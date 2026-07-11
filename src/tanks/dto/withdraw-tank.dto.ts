import { IsString, IsNumber, IsPositive } from 'class-validator'

export class WithdrawTankDto {
  @IsString()
  productionOrder: string

  @IsNumber()
  @IsPositive()
  weightKg: number
}