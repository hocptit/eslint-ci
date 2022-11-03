import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BillingDetailDto, IBankAddressDto } from '@modules/payment/dto/request/create-bank-account.dto';

export class WireBankAccountDataDto {
    @ApiPropertyOptional({ example: '397681ef-df34-40eb-9115-1becd94615b5' })
    id: string;

    @ApiPropertyOptional({ example: 'pending' })
    status: string;

    @ApiPropertyOptional({ example: 'WELLS FARGO BANK, NA ****0010' })
    description: string;

    @ApiPropertyOptional({ example: 'CIR2SB8UAN' })
    trackingRef: string;

    @ApiPropertyOptional({ example: 'a9a71b77-d83d-4fbc-997f-41a33550c594' })
    fingerprint: string;

    @ApiPropertyOptional({ example: true })
    virtualAccountEnabled: boolean;

    @ApiPropertyOptional({
        example: {
            name: 'Satoshi Nakamoto',
            line1: '100 Money Street',
            line2: 'Suite 1',
            city: 'Boston',
            postalCode: '01234',
            district: 'MA',
            country: 'US',
        },
    })
    billingDetails: BillingDetailDto;

    @ApiPropertyOptional({
        example: {
            bankName: 'WELLS FARGO BANK, NA',
            line1: '100 Money Street',
            line2: 'Suite 1',
            city: 'SAN FRANCISCO',
            district: 'CA',
            country: 'US',
        },
    })
    bankAddress: IBankAddressDto;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    createDate: Date;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    updateDate: Date;
}

export class CreateWireBankAccountResultDto {
    @ApiPropertyOptional({ type: WireBankAccountDataDto })
    @Type(() => WireBankAccountDataDto)
    data: WireBankAccountDataDto;
}
