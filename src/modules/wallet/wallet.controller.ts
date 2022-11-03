import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LoggerService } from '@shared/modules/loggers/logger.service';

import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { WalletUsecase } from '@modules/wallet/wallet.usecase';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { IWalletUSDCOfOwner } from '@modules/wallet/interface';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { WalletTransaction } from '@models/entities/WalletTransaction.entity';
import { ListWalletTransactionDto } from '@modules/wallet/dto/list-wallet-transaction.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseAuthGuard()
export class WalletController {
    constructor(private readonly walletUsecase: WalletUsecase, private loggerService: LoggerService) {}

    private logger = this.loggerService.getLogger('WalletController');

    @ApiOkResponsePayload(IWalletUSDCOfOwner, EApiOkResponsePayload.OBJECT)
    @Get()
    async getOwnerBalanceApi(@CurrentUser() user: IPayloadUserJwt) {
        this.logger.info(`[getOwnerBalanceApi]`, user);
        return this.walletUsecase.getWalletUSDCOfOwner(user.ownerId);
    }

    @Get('/transactions')
    @ApiOkResponsePayload(WalletTransaction, EApiOkResponsePayload.ARRAY, true)
    findAll(@CurrentUser() user: IPayloadUserJwt, @Query() listTransactionDto: ListWalletTransactionDto) {
        return this.walletUsecase.getWalletTransaction(user.ownerId, listTransactionDto);
    }
}
