import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AmountDto } from '@modules/payment/dto/request/withdraw-fiat.dto';

export class DescriptionDto {
    @ApiPropertyOptional({ example: 'wire' })
    type: string;

    @ApiPropertyOptional({ example: 'b0ad2c50-9181-4b16-afc7-961945e76468' })
    id: string;

    @ApiPropertyOptional({ example: 'WELLS FARGO BANK, NA ****0010' })
    name: string;
}

export class WithdrawFiatDataDto {
    @ApiPropertyOptional({ example: 'fe6514bc-c414-4f7b-9fd6-7ad05da97139' })
    id: string;

    @ApiPropertyOptional({
        type: AmountDto,
        example: {
            amount: '0.01',
            currency: 'USD',
        },
    })
    @Type(() => AmountDto)
    amount: AmountDto;

    @ApiPropertyOptional({ example: 'pending' })
    status: string;

    @ApiPropertyOptional({ example: '1004246889' })
    sourceWalletId: string;

    @ApiPropertyOptional({ type: DescriptionDto })
    @Type(() => DescriptionDto)
    description: DescriptionDto;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    createDate: Date;

    @ApiPropertyOptional({ example: new Date('2022-10-23T07:08:12.224Z') })
    updateDate: Date;
}

export class WithdrawWireBankDto {
    @ApiPropertyOptional({ example: 'complete' })
    prepareStatus: string;

    @ApiPropertyOptional({ example: 'pending' })
    withdrawStatus: string;

    @ApiPropertyOptional({ example: '635e02f85215d1e4a73c26dd' })
    transactionId: string;
}
