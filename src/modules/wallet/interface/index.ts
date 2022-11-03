import { Wallet } from '@models/entities/Wallet.entity';
import { ApiProperty } from '@nestjs/swagger';

export * from './fortress.interface';
export * from './circle.interface';

export class IWalletUSDCOfOwner extends Wallet {
    @ApiProperty()
    circleBalance: string;

    @ApiProperty()
    usdcAddress: string;

    @ApiProperty()
    exchangeAddress: string;
}
