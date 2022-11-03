import {
    Action,
    CurrencyType,
    ETransferType,
    MarketplaceTransactionDocument,
    PaymentType,
    RoundType,
    Status,
} from '@models/entities/MarketplaceTransaction.entity';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto, CreatePaymentIntentDto } from './dto/request/payment.dto';
import { CircleService } from '@modules/payment/circle.service';
import { ICreateWallet, ITransfer } from './interface';
import { CmcTokenId, Currency } from '@constants/circle.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CoinMarketCapService } from './coinmarketcap.service';
import MarketplaceTransactionRepository from '@models/repositories/MarketplaceTransaction.repository';
import { ListTransactionDto } from './dto/request/list-transaction.dto';
import { OwnerService } from '@modules/owner/owner.service';
import OwnerRepository from '@models/repositories/Owner.repository';
import { Owner } from '@models/entities/Owner.entity';
import { BadRequestException } from '@shared/exception';
import { ErrorConstant } from '@constants/error.constant';
import { NOTIFY_MESSAGE } from '@constants/notify-message.constant';
import { ENotifyType } from '@models/entities/Notify.entity';
import { NotifyService } from '@modules/notify/notify.service';
import { WalletService } from '@modules/wallet/wallet.service';
import {
    EAction,
    ESourceType,
    EStatusTransaction,
    WalletTransactionDocument,
} from '@models/entities/WalletTransaction.entity';

@Injectable()
export class PaymentService {
    constructor(
        private marketplaceTransactionRepository: MarketplaceTransactionRepository,
        private ownerRepository: OwnerRepository,
        @Inject(forwardRef(() => CircleService)) private readonly circleService: CircleService,
        private loggerService: LoggerService,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
        private readonly coinMarketCapService: CoinMarketCapService,
        private readonly ownerService: OwnerService,
        private readonly notifyService: NotifyService,
    ) {}
    private logger = this.loggerService.getLogger('PaymentService');

    createCardDeposit = async (ownerId: string, paymentData: CreatePaymentDto) => {
        const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
            owner: ownerId,
            action: Action.Deposit,
            status: Status.Processing,
            paymentType: PaymentType.Circle,
            currencyType: CurrencyType.Fiat,
            transferType: ETransferType.CARD,
            amount: paymentData.amount.amount,
            currency: paymentData.amount.currency,
        });
        const payment = await this.circleService.createPayment(paymentData);
        const owner = await this.ownerService.getOwner(ownerId);
        if (!owner) {
            throw new BadRequestException({ message: ErrorConstant.PAYMENT.USER_NOT_FOUND });
        }
        await this.ownerRepository.ownerDocumentModel.findOneAndUpdate(
            { _id: ownerId },
            { circleActiveCardId: paymentData.source.id },
        );
        transaction.sessionId = payment.data.id;
        transaction.details = [payment.data];
        await transaction.save();
        this.logger.info('[createFiatDeposit] Deposit Payment data from circle: ', payment);
        return await this.marketplaceTransactionRepository.findById(transaction._id.toString());
    };

    createCryptoDeposit = async (owner: any, paymentData: CreatePaymentIntentDto) => {
        const currency = paymentData.amount.currency;
        let transaction;
        if (currency !== Currency.Usd) {
            const tokenPrice = await this.coinMarketCapService.getTokenPriceById(CmcTokenId[currency]);
            const currencyAmount = Number(paymentData.amount.amount) * Number(tokenPrice);
            transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                owner: owner._id,
                action: Action.Deposit,
                status: Status.Processing,
                paymentType: 'circle',
                currencyType: CurrencyType.Crypto,
                round: owner.fromLA ? RoundType.LA : null,
                amount: currencyAmount.toFixed(5),
                currency: Currency.Usd,
            });
        } else {
            transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                owner: owner._id,
                action: Action.Deposit,
                status: Status.Processing,
                paymentType: 'circle',
                currencyType: CurrencyType.Crypto,
                round: owner.fromLA ? RoundType.LA : null,
                amount: paymentData.amount.amount,
                currency: paymentData.amount.currency,
            });
        }
        const payment = await this.circleService.createPaymentIntent(paymentData);
        await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOneAndUpdate(
            { _id: transaction._id },
            { sessionId: payment.data.id, details: [payment.data] },
        );
        return {
            ...payment,
            transactionId: transaction._id,
        };
    };

    async saveCircleCardOwner(ownerId: string, cardId: string, keyId: string): Promise<Owner> {
        await this.ownerRepository.ownerDocumentModel.findOneAndUpdate(
            {
                _id: ownerId,
            },
            {
                $push: { circleCardIds: { cardId, keyId } },
            },
        );
        const user = await this.ownerService.getOwner(ownerId);
        return user;
    }

    async removeCircleCardOwner(ownerId: string, cardId: string): Promise<Owner> {
        await this.ownerRepository.ownerDocumentModel.findOneAndUpdate(
            {
                _id: ownerId,
            },
            {
                $pull: { circleCardIds: { cardId } },
            },
        );
        const user = await this.ownerService.getOwner(ownerId);
        return user;
    }

    getListTransaction = async (ownerId: string, listTransactionDto: ListTransactionDto) => {
        return await this.marketplaceTransactionRepository.listMarketplaceTransaction(ownerId, listTransactionDto);
    };

    createCircleWallet = async (data: ICreateWallet) => {
        return await this.circleService.createWallet(data);
    };

    getCircleWallet = async (walletId: string) => {
        return await this.circleService.getWallet(walletId);
    };

    transferCircleWallet = async (data: ITransfer) => {
        return await this.circleService.walletTransfer(data);
    };

    getTransactionByPreviousSessionId = async (previousSessionId: string) => {
        const data = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
            previousSessionId: previousSessionId,
        });
        return data;
    };

    getTransactionById = async (id: string) => {
        const data = await this.marketplaceTransactionRepository.findById(id);
        return data;
    };

    async createNotifyWhenWithdrawFortressToCircleFailed(error: string, circleSessionId: string) {
        this.logger.error(
            '[withdrawMoneyFromFortressToCircle] Withdraw Money From Fortress To Circle Failed, error: ',
            error,
        );
        // Update Circle to Wirebank transaction failed
        const withdrawCircleToWirebank =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                sessionId: circleSessionId,
            });
        if (withdrawCircleToWirebank.status !== Status.Failed) {
            withdrawCircleToWirebank.status = Status.Failed;
            await withdrawCircleToWirebank.save();
            // Send notification failed
            await this.createNotifyWithdrawFailed(withdrawCircleToWirebank);
        }

        // Update Fortress to Circle transaction failed
        const withdrawFortressToCircle =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                sessionId: withdrawCircleToWirebank.previousSessionId,
            });
        withdrawFortressToCircle.status = Status.Failed;
        await withdrawFortressToCircle.save();
    }

    async createNotifyWhenWithdrawCircleToWireFailed(error: string, sessionId: string) {
        this.logger.error('[withdrawWithWireBank] Withdraw Money From Circle To Wirebank Failed, error: ', error);
        // Update transaction failed
        const withdrawCircleToWirebank =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                sessionId: sessionId,
            });
        withdrawCircleToWirebank.status = Status.Failed;
        await withdrawCircleToWirebank.save();

        // Send notification failed
        await this.createNotifyWithdrawFailed(withdrawCircleToWirebank);
    }

    async createNotifyWithdrawFailed(transaction: MarketplaceTransactionDocument) {
        // Send notification failed
        const notify = {
            ownerId: transaction.owner,
            data: {
                message: NOTIFY_MESSAGE.WITHDRAW_FAILED(),
                ref: transaction._id,
            },
            type: ENotifyType.WITHDRAW,
        };
        await this.notifyService.create(notify);
    }

    async createWalletTransactionFailedWhenWithdrawFailed(
        ownerId: string,
        transaction: MarketplaceTransactionDocument,
    ) {
        const walletOfOwner = await this.walletService.getOwnerWallet(ownerId);
        const data: Partial<WalletTransactionDocument> = {
            walletId: walletOfOwner.circleAddressOnPolygon,
            sourceType: ESourceType.FORTRESS,
            action: EAction.WITHDRAW,
            amount: transaction.withdrawInput.amount.toString(),
            status: EStatusTransaction.FAILED,
        };
        return this.walletService.createWalletTransaction(data);
    }
}
