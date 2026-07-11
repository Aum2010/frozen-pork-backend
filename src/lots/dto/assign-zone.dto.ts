import { IsString, MinLength } from 'class-validator'

export class AssignZoneDto {
  @IsString()
  @MinLength(1)
  zone: string
}