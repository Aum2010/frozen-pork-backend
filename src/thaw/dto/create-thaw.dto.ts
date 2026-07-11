import { IsString, IsNumber, IsPositive } from 'class-validator'

export class CreateThawDto {
  @IsString()
  lotId: string

  @IsNumber()
  @IsPositive()
  weightKg: number
}