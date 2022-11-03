import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateBankAccountDto } from '@modules/payment/dto/request/create-bank-account.dto';
import { IsNumber, Min } from 'class-validator';

export class DepositWireDto {
    @ApiProperty()
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({ type: CreateBankAccountDto })
    @Type(() => CreateBankAccountDto)
    bankData: CreateBankAccountDto;
}
