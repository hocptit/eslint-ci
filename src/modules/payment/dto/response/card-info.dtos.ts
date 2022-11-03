import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingDetailDto } from '@modules/payment/dto/request/create-bank-account.dto';
import { VerificationDto } from './payment.dtos';
import { MetadataDto } from '../request/payment.dto';

export class CardInfoDto {
    @ApiPropertyOptional({ example: '397681ef-df34-40eb-9115-1becd94615b5' })
    id: string;

    @ApiPropertyOptional({ example: 'complete' })
    status: string;

    @ApiPropertyOptional({ example: '0007' })
    last4: string;

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

    @ApiPropertyOptional({ example: 1 })
    expMonth: number;

    @ApiPropertyOptional({ example: 2023 })
    expYear: number;

    @ApiPropertyOptional({ example: 'VISA' })
    network: string;

    @ApiPropertyOptional({ example: '400740' })
    bin: string;

    @ApiPropertyOptional({ example: 'ES' })
    issuerCountry: string;

    @ApiPropertyOptional({ example: 'debit' })
    fundingType: string;

    @ApiPropertyOptional({ example: '603b2185-1901-4eae-9b98-cc20c32d0709' })
    fingerprint: string;

    @ApiPropertyOptional({
        type: VerificationDto,
        example: {
            cvv: 'pass',
            avs: 'Y',
        },
    })
    verification: VerificationDto;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    createDate: Date;

    @ApiPropertyOptional({
        type: MetadataDto,
        example: {
            email: 'phuchauzalo2@gmail.com',
        },
    })
    metadata: MetadataDto;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    updateDate: Date;
}
