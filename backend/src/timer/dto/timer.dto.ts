import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class StartTimerDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StopTimerDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  entryId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
