import { ApiProperty } from '@nestjs/swagger';
import { EPayoutCurrency, ETypePayout } from '@constants/circle.constant';
import { Type } from 'class-transformer';
import { CreateBankAccountDto } from '@modules/payment/dto/request/create-bank-account.dto';

export class DestinationPayoutDto {
    @ApiProperty()
    type: ETypePayout;

    @ApiProperty()
    id: string;
}

export class AmountDto {
    @ApiProperty()
    amount: string;

    @ApiProperty()
    currency: EPayoutCurrency;
}

export class PayoutMetaDataDto {
    @ApiProperty()
    beneficiaryEmail: string;
}

export class WithdrawFiatDto {
    @ApiProperty({ example: 8 })
    amount: number;

    @ApiProperty({
        type: PayoutMetaDataDto,
        example: {
            beneficiaryEmail: 'satoshi@circle.com',
        },
    })
    @Type(() => PayoutMetaDataDto)
    metadata: PayoutMetaDataDto;

    @ApiProperty({ type: CreateBankAccountDto })
    @Type(() => CreateBankAccountDto)
    bankData: CreateBankAccountDto;
}
