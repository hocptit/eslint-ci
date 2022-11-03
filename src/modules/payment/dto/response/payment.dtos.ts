import { ApiPropertyOptional } from '@nestjs/swagger';
import { AmountDto, MetadataDto } from '../request/payment.dto';

export class PaymentMethodsDto {
    @ApiPropertyOptional({ example: 'blockchain' })
    type: string;

    @ApiPropertyOptional({ example: 'ETH' })
    chain: string;

    @ApiPropertyOptional({ example: '0xc8ea6bf7207e5b209b248dc33979512b6ac1a04a' })
    address: string;
}

export class feesDto {
    @ApiPropertyOptional({ example: 'blockchainLeaseFee' })
    type: string;

    @ApiPropertyOptional({ example: '0.00' })
    amount: string;

    @ApiPropertyOptional({ example: 'USD' })
    currency: string;
}

export class VerificationDto {
    @ApiPropertyOptional({ example: 'pass' })
    cvv: string;

    @ApiPropertyOptional({ example: 'Y' })
    avs: string;
}

export class PaymentDto {
    @ApiPropertyOptional({ example: 'b0ad2c50-9181-4b16-afc7-961945e76468' })
    id: string;

    @ApiPropertyOptional({ example: 'payment' })
    type: string;

    @ApiPropertyOptional({ example: 'confirmed' })
    status: string;

    @ApiPropertyOptional({ example: 'Merchant Payment' })
    description: string;

    @ApiPropertyOptional({
        type: AmountDto,
        example: {
            amount: '1.00',
            currency: 'USD',
        },
    })
    amount: AmountDto;

    @ApiPropertyOptional({
        type: feesDto,
        example: {
            amount: '0.33',
            currency: 'USD',
        },
    })
    fees: feesDto;

    @ApiPropertyOptional({ example: '2022-10-16T07:15:32.382686Z' })
    createDate: string;

    @ApiPropertyOptional({ example: '2022-10-16T07:15:32.382686Z' })
    updateDate: string;

    @ApiPropertyOptional({ example: 'f7840f39-c3ec-48fc-81c6-f9844d0d18c1' })
    merchantId: string;

    @ApiPropertyOptional({ example: '1004246889' })
    merchantWalletId: string;

    @ApiPropertyOptional({ example: [] })
    refunds: [];

    @ApiPropertyOptional({
        type: VerificationDto,
        example: {
            cvv: 'pass',
            avs: 'Y',
        },
    })
    verification: VerificationDto;

    @ApiPropertyOptional({
        type: MetadataDto,
        example: {
            email: 'phuchauzalo2@gmail.com',
        },
    })
    metadata: MetadataDto;
}
