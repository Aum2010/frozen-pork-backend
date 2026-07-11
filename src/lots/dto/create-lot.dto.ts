import { IsString, IsNumber, IsPositive, IsDateString, MinLength } from 'class-validator'

export class CreateLotDto {
  @IsString()
  @MinLength(1)
  lotNumber: string

  @IsString()
  @MinLength(1)
  supplier: string

  @IsNumber()
  @IsPositive()
  weightKg: number

  @IsDateString()
  receivedAt: string
}