import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWireBankAccountResultDto } from '@modules/payment/dto/response/create-bank-account.dto';

export class PrepareWithdrawWireDto {
    @ApiPropertyOptional({ example: '3e20378d-7226-472c-8cf0-ead7d62e7d31' })
    sessionId: string;

    @ApiPropertyOptional()
    bankData: CreateWireBankAccountResultDto;
}
