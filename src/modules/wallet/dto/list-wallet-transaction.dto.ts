import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ListWalletTransactionDto extends BasePaginationDto {
    @ApiPropertyOptional({ enum: ['updated_at'] })
    @IsEnum(['updated_at'])
    @IsOptional()
    sortBy?: string;

    ownerId: string;
}
