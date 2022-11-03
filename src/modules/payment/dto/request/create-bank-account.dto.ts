import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BillingDetailDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    country: string;

    @ApiProperty()
    line1: string;

    @ApiPropertyOptional()
    @IsOptional()
    line2?: string;

    @ApiPropertyOptional()
    @IsOptional()
    district?: string;

    @ApiPropertyOptional()
    @IsOptional()
    postalCode?: string;
}

export class IBankAddressDto {
    @ApiPropertyOptional()
    @IsOptional()
    bankName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    city?: string;

    @ApiProperty()
    country: string;

    @ApiPropertyOptional()
    @IsOptional()
    line1?: string;

    @ApiPropertyOptional()
    @IsOptional()
    line2?: string;

    @ApiPropertyOptional()
    @IsOptional()
    district?: string;
}

export class CreateBankAccountDto {
    @ApiPropertyOptional({ example: '12340010' })
    @IsOptional()
    @IsString()
    accountNumber?: string;

    @ApiPropertyOptional({ example: '121000248' })
    @IsOptional()
    @IsString()
    routingNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    iban?: string;

    @ApiProperty({
        type: BillingDetailDto,
        example: {
            name: 'Satoshi Nakamoto',
            city: 'Boston',
            country: 'US',
            line1: '100 Money Street',
            line2: 'Suite 1',
            district: 'MA',
            postalCode: '01234',
        },
    })
    @Type(() => BillingDetailDto)
    billingDetails: BillingDetailDto;

    @ApiProperty({
        type: IBankAddressDto,
        example: {
            bankName: 'SAN FRANCISCO',
            city: 'SAN FRANCISCO',
            country: 'US',
            line1: '100 Money Street',
            line2: 'Suite 1',
            district: 'CA',
        },
    })
    @Type(() => IBankAddressDto)
    bankAddress: IBankAddressDto;
}
