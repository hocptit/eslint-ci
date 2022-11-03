import { Currency } from '@constants/circle.constant';
import { Status } from '@models/entities/MarketplaceTransaction.entity';
import { ApiPropertyOptional } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export class CheckDepositDto {
    @ApiPropertyOptional({ example: 'COMPLETED' })
    status: Status;

    @ApiPropertyOptional({ example: '20' })
    amount: string;

    @ApiPropertyOptional({ example: Currency.Usd })
    currency: Currency.Usd;
}
