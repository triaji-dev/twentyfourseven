import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateTakeawayDto {
  @IsUUID()
  userId: string;

  @IsString()
  content: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
