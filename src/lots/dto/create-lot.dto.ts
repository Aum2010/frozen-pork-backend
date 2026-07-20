import { IsString, IsNumber, IsPositive, IsDateString, MinLength, IsOptional } from 'class-validator'

export class CreateLotDto {
  @IsString()
  lotNumber: string

  @IsString()
  supplier: string

  @IsNumber()
  @IsPositive()
  weightKg: number

  @IsDateString()
  receivedAt: string

  @IsOptional()
  @IsDateString()
  expiryDate?: string  // เพิ่ม
}