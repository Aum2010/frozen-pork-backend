import { IsNumber, IsPositive } from 'class-validator'

export class StartThawAutoDto {
  @IsNumber()
  @IsPositive()
  totalWeightKg: number
}