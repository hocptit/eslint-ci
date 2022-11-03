import { ApiPropertyOptional } from '@nestjs/swagger';
import { AmountDto } from '../request/payment.dto';

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

export class timelineDtos {
    @ApiPropertyOptional({ example: 'pending' })
    status: string;

    @ApiPropertyOptional({ example: '2022-10-16T07:15:35.058345Z' })
    time: string;
}

export class PaymentIntentDto {
    @ApiPropertyOptional({ example: 'b0ad2c50-9181-4b16-afc7-961945e76468' })
    id: string;

    @ApiPropertyOptional({
        type: AmountDto,
        example: {
            amount: '1.00',
            currency: 'USD',
        },
    })
    amount: AmountDto;

    @ApiPropertyOptional({
        type: AmountDto,
        example: {
            amount: '0.00',
            currency: 'USD',
        },
    })
    amountPaid: AmountDto;

    @ApiPropertyOptional({ example: 'USD' })
    settlementCurrency: string;

    @ApiPropertyOptional({ example: [PaymentMethodsDto] })
    paymentMethods: [];

    @ApiPropertyOptional({ example: [feesDto] })
    fees: [];

    @ApiPropertyOptional({ example: [] })
    paymentIds: [];

    @ApiPropertyOptional({ example: [timelineDtos] })
    timeline: [];

    @ApiPropertyOptional({ example: '2022-10-16T07:15:32.382686Z' })
    createDate: string;

    @ApiPropertyOptional({ example: '2022-10-16T07:15:32.382686Z' })
    updateDate: string;

    @ApiPropertyOptional({ example: '2022-10-16T15:15:34.891069Z' })
    expiresOn: string;
}
