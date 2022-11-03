import { ApiPropertyOptional } from '@nestjs/swagger';

export class DepositWireBankDto {
    @ApiPropertyOptional({ example: '48574301-c175-40d8-9c87-25ef69e1be9e' })
    wireBankAccountId: string;
}
