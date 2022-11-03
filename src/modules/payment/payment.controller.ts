import { Body, Req, Controller, Get, Post, Request, Delete, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { CreateCardDto, CreatePaymentDto } from './dto/request/payment.dto';
import { PaymentUsecase } from './payment.usecase';
import { WithdrawFiatDto } from '@modules/payment/dto/request/withdraw-fiat.dto';
import { WithdrawWireBankDto } from '@modules/payment/dto/response/withdraw-wire-bank';
import { MarketplaceTransaction } from '@models/entities/MarketplaceTransaction.entity';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { PublicKeyDto } from './dto/response/public-key.dto';
import { PaymentDto } from './dto/response/payment.dtos';
import { CheckDepositDto } from './dto/response/check-deposit.dto';
import { DepositWireDto } from '@modules/payment/dto/request/deposit-wire.dto';
import { DepositWireBankDto } from '@modules/payment/dto/response/deposit-wire-bank.dto';
import { InstructionWireBankDto } from '@modules/payment/dto/response/instruction-wire-bank.dto';
import { PrepareWithdrawWireDto } from '@modules/payment/dto/response/prepare-withdraw-wire.dto';
import { ListTransactionDto } from './dto/request/list-transaction.dto';
import { CardInfoDto } from './dto/response/card-info.dtos';
import { Owner } from '@models/entities/Owner.entity';
import { WithdrawCryptoResponseDto } from './dto/response/withdraw-crypto-response.dto';
import { WithdrawCryptoDto } from './dto/request/withdraw-crypto.dto';

@UseAuthGuard()
@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentUsecase: PaymentUsecase, private loggerService: LoggerService) {}
    private logger = this.loggerService.getLogger('PaymentController');

    @Post('circle/deposit/card')
    @ApiOkResponsePayload(MarketplaceTransaction, EApiOkResponsePayload.OBJECT)
    async depositFiat(@Req() request: Request, @Body() createPaymentDto: CreatePaymentDto, @CurrentUser() user: any) {
        return await this.paymentUsecase.depositByCardCircle(user.userId, createPaymentDto, request);
    }

    // @Post('circle/deposit/crypto')
    // @ApiOkResponsePayload(MarketplaceTransaction, EApiOkResponsePayload.OBJECT)
    // async depositCrypto(@Body() createPaymentIntent: CreatePaymentIntentDto, @CurrentUser() user: any) {
    //     return await this.paymentUseCase.depositCrypto(user.userId, createPaymentIntent);
    // }

    @Post('circle/card')
    @ApiOkResponsePayload(CardInfoDto, EApiOkResponsePayload.OBJECT)
    async createCard(@Req() req: Request, @Body() createCardDetail: CreateCardDto, @CurrentUser() user: any) {
        return await this.paymentUsecase.createCard(req, createCardDetail, user.userId);
    }

    @ApiOkResponsePayload(CardInfoDto, EApiOkResponsePayload.OBJECT)
    @Get('/circle/card/:cardId')
    async getCircleCardById(@Param('cardId') cardId: string) {
        return await this.paymentUsecase.getCircleCardById(cardId);
    }

    @Delete('/circle/card/remove/:cardId')
    @ApiOkResponsePayload(Owner, EApiOkResponsePayload.OBJECT)
    async deleteCard(@CurrentUser() user: any, @Param('cardId') cardId: string) {
        return await this.paymentUsecase.deleteCard(user.userId, cardId);
    }

    @Get('circle/generatePublicKey')
    @ApiOkResponsePayload(PublicKeyDto, EApiOkResponsePayload.OBJECT)
    async generatePublicKey() {
        return await this.paymentUsecase.generatePublicKey();
    }

    @Get('/circle/fiat/:paymentId')
    @ApiOkResponsePayload(PaymentDto, EApiOkResponsePayload.OBJECT)
    async getPayment(@Param('paymentId') paymentId: string) {
        return await this.paymentUsecase.getPayment(paymentId);
    }

    // @Get('/circle/crypto/:paymentIntentId')
    // @ApiOkResponse({ type: PaymentIntentDto })
    // async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    //     return await this.paymentUseCase.getPaymentIntent(paymentIntentId);
    // }

    @Get('/transaction/list')
    async getListTransaction(@CurrentUser() user: any, @Query() listTransactionDto: ListTransactionDto) {
        return await this.paymentUsecase.getListTransaction(user.userId, listTransactionDto);
    }

    @Post('circle/deposit/wire-bank')
    @ApiOkResponsePayload(DepositWireBankDto, EApiOkResponsePayload.OBJECT)
    async createWireBankForDeposit(@CurrentUser() user: any, @Body() depositWireDto: DepositWireDto) {
        this.logger.info(
            `[createWireBankForDeposit] userId: ${JSON.stringify(user)} and input: ${JSON.stringify(depositWireDto)}`,
        );
        return this.paymentUsecase.createWireBankForDeposit(user.userId, depositWireDto);
    }

    @Post('circle/deposit/check-wire-bank/:id')
    @ApiOkResponsePayload(InstructionWireBankDto, EApiOkResponsePayload.OBJECT)
    async checkWireBankAndCreateInstruction(@CurrentUser() user: any, @Param('id') sessionId: string) {
        this.logger.info('[checkWireBankAndCreateInstructions] sessionId : ', sessionId);
        return this.paymentUsecase.checkWireBankAndCreateInstruction(user.userId, sessionId);
    }

    @Post('circle/withdraw/wire-bank')
    @ApiOkResponsePayload(PrepareWithdrawWireDto, EApiOkResponsePayload.OBJECT)
    async prepareWithdrawByWireBank(@CurrentUser() user: any, @Body() withdrawFiatDto: WithdrawFiatDto) {
        this.logger.info(
            `[prepareWithdrawByWireBank] Prepare Withdraw By WireBank for Owner: ${JSON.stringify(
                user,
            )}and input:  ${JSON.stringify(withdrawFiatDto)}`,
        );
        return this.paymentUsecase.prepareWithdrawByWireBank(user.userId, withdrawFiatDto);
    }

    @Post('circle/withdraw/check-wire-bank/:id')
    @ApiOkResponsePayload(WithdrawWireBankDto, EApiOkResponsePayload.OBJECT)
    async checkPrepareAndStartWithdraw(@CurrentUser() user: any, @Param('id') sessionId: string) {
        this.logger.info(
            `[checkPrepareAndStartWithdraw] Check Prepare And Start Withdraw for Owner: ${JSON.stringify(
                user,
            )} with sessionId: ${sessionId}`,
        );
        return this.paymentUsecase.checkPrepareAndStartWithdraw(user.userId, sessionId);
    }

    @ApiOkResponsePayload(CheckDepositDto, EApiOkResponsePayload.OBJECT)
    @Get('/circle/check-transaction/:id')
    async checkTransactionComplete(@Param('id') id: string) {
        return await this.paymentUsecase.checkTransactionComplete(id);
    }

    @Post('/withdraw/crypto')
    @ApiOkResponsePayload(WithdrawCryptoResponseDto, EApiOkResponsePayload.OBJECT)
    async withdrawCrypto(@CurrentUser() user: any, @Body() withdrawCryptoDto: WithdrawCryptoDto) {
        return this.paymentUsecase.withdrawCrypto(user.userId, withdrawCryptoDto);
    }

    @ApiOkResponsePayload(MarketplaceTransaction, EApiOkResponsePayload.OBJECT)
    @Get('/transaction/:id')
    async getTransactionById(@Param('id') id: string) {
        return await this.paymentUsecase.getTransactionById(id);
    }
}
