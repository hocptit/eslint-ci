import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ENftStatus } from '@models/entities/Nft.entity';

enum EType {
    NFT_ID = 'nftId',
    PRICE = 'price',
    DATE_PURCHASED = 'datePurchased',
}

class NftFilter {
    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    nftId?: number;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    owner?: string;

    @ApiPropertyOptional({ type: String })
    @IsOptional()
    @IsString()
    ownerId?: string;

    @ApiPropertyOptional({ enum: ENftStatus })
    @IsOptional()
    @IsEnum(ENftStatus)
    status?: ENftStatus;

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiPropertyOptional({ type: Number })
    @IsOptional()
    @IsNumber()
    datePurchased?: number;
}

export class GetNftsQueryDto extends BasePaginationDto {
    @ApiProperty({ enum: EType })
    @IsEnum(EType)
    @IsOptional()
    sortBy: EType;

    @ApiPropertyOptional({ type: NftFilter })
    @IsOptional()
    filter?: NftFilter;
}
