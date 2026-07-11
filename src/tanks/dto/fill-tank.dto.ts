import { IsString, IsNumber, IsPositive } from 'class-validator'

export class FillTankDto {
  @IsString()
  thawEventId: string

  @IsNumber()
  @IsPositive()
  weightKg: number
}