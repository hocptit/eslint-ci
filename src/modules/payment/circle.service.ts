import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { CircleConfig, Currency, EPayoutCurrency, ETransferSourceType, ETypePayout } from '@constants/circle.constant';
import { CirclePayoutStatus } from '@constants/circle.constant';
import { CircleNotificationType, CirclePaymentStatus, CirclePaymentIntentStatus } from '@constants/circle.constant';
import {
    Status,
    Action,
    CurrencyType,
    ETransferType,
    PaymentType,
} from '@models/entities/MarketplaceTransaction.entity';
import MarketplaceTransactionRepository from '@models/repositories/MarketplaceTransaction.repository';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import {
    ICircleGetWalletResponse,
    ICreatePayout,
    ICreateWallet,
    ICreateWalletResponse,
    IPayloadCreateAddress,
} from '@modules/payment/interface';
import { CreateCardDto, CreatePaymentDto, CreatePaymentIntentDto } from './dto/request/payment.dto';
import { WalletService } from '@modules/wallet/wallet.service';
import { v4, v4 as uuidv4 } from 'uuid';
import { EChain, ECircleType } from './enum/payment.enum';
import { CreateBankAccountDto } from '@modules/payment/dto/request/create-bank-account.dto';
import { NotifyService } from '@modules/notify/notify.service';
import { NOTIFY_MESSAGE } from '@constants/notify-message.constant';
import { ENotifyType } from '@models/entities/Notify.entity';
import { ErrorConstant } from '@constants/error.constant';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import { EAction, ESourceType, EStatusTransaction } from '@models/entities/WalletTransaction.entity';
import { PaymentService } from '@modules/payment/payment.service';

@Injectable()
export class CircleService {
    private axiosInstance: AxiosInstance;
    constructor(
        private marketplaceTransactionRepository: MarketplaceTransactionRepository,
        private configService: ConfigService,
        private loggerService: LoggerService,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
        private readonly notifyService: NotifyService,
        @Inject(forwardRef(() => PaymentService))
        private readonly paymentService: PaymentService,
        private walletTransactionRepository: WalletTransactionRepository,
    ) {
        this.axiosInstance = axios.create({
            baseURL: this.configService.get(EEnvKey.CIRCLE_API_URL),
            headers: {
                Authorization: `Bearer ${this.configService.get(EEnvKey.CIRCLE_API_KEY)}`,
            },
        });
    }
    private logger = this.loggerService.getLogger('CircleService');
    private feeWhenWithdrawCircle = this.configService.get(EEnvKey.FEE_WHEN_WITHDRAW_CIRCLE);

    generatePublicKey = async (): Promise<any> => {
        try {
            const response = await this.axiosInstance.get(CircleConfig.circle.api.getPublicKey);
            this.logger.info('[generatePublicKey] Get Public key from Circle: ', response?.data?.data);
            return response?.data?.data;
        } catch (error) {
            this.logger.error(
                `[generatePublicKey] Create Circle reservation fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to generate public key Circle payment ');
        }
    };

    createCard = async (createCardDetail: CreateCardDto): Promise<any> => {
        try {
            delete createCardDetail.metadata.phoneNumber;
            const response = await this.axiosInstance.post(CircleConfig.circle.api.cards, createCardDetail, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `[createCard] Create Circle card fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to save card detail Circle payment');
        }
    };

    createPayment = async (createPaymentDetail: CreatePaymentDto): Promise<any> => {
        try {
            const response = await this.axiosInstance.post(CircleConfig.circle.api.payments, createPaymentDetail, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `[createPayment] Create Circle payment fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to create Circle payment');
        }
    };

    getPayment = async (paymentId: string): Promise<any> => {
        try {
            const response = await this.axiosInstance.get(`${CircleConfig.circle.api.payments}/${paymentId}`);
            this.logger.info('[getPayment] Get Circle payment :', response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `[getPayment] Get Circle payment fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to get Circle payment');
        }
    };

    createPaymentIntent = async (createPaymenIntenttDetail: CreatePaymentIntentDto): Promise<any> => {
        try {
            const response = await this.axiosInstance.post(
                CircleConfig.circle.api.paymentIntents,
                createPaymenIntenttDetail,
                {
                    headers: {
                        content_type: 'application/json',
                    },
                },
            );
            this.logger.info('[createPaymentIntent] Create Circle payment intent ', response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `[createPaymentIntent] Create Circle payment fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to create Circle payment');
        }
    };

    getPaymentIntents = async (paymentIntendId: string): Promise<any> => {
        try {
            const response = await this.axiosInstance.get(
                `${CircleConfig.circle.api.paymentIntents}/${paymentIntendId}`,
            );
            this.logger.info('[getPaymentIntents] Get Circle payment intent: ', response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `[getPaymentIntents] Get Circle payment intents fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to get Circle payment intents');
        }
    };

    getCardInfo = async (cardId: string): Promise<any> => {
        try {
            const response = await this.axiosInstance.get(`${CircleConfig.circle.api.cards}/${cardId}`);
            this.logger.info(`[getCardInfo] Get Circle Card info: `, response);
            return response.data;
        } catch (error) {
            this.logger.error(
                `[getCardInfo] Get Circle Card info fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to get card info');
        }
    };

    getListPayment = async (queryParam: any): Promise<any> => {
        try {
            const response = await this.axiosInstance.get(CircleConfig.circle.api.payments, {
                params: {
                    ...queryParam,
                },
            });
            this.logger.info(`[getListPayment] Get list payment: `, response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `[getListPayment] Get List Payment fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to get Circle List Payment info: ');
        }
    };

    handlePaymentEvent = async (data: any) => {
        const { payment } = data;
        const isWireBank = payment?.source?.type === CurrencyType.Wire;
        if (isWireBank) {
            this.logger.info(`[handlePaymentEvent] Circle event info: `, payment);
            const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne(
                { sessionId: payment.source.id },
            );
            if (!transaction) {
                this.logger.info(
                    `[handlePaymentEvent] ${ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND} with sessionId: ${payment.id}`,
                );
                return;
            }

            switch (payment.status) {
                case CirclePaymentStatus.Paid:
                    if (!isWireBank) {
                        break;
                    }

                    if (payment.amount && payment.amount.amount && payment.fees && payment.fees.amount)
                        transaction.amountPaidForDepositWire =
                            transaction.amountPaidForDepositWire +
                            Number(payment.amount.amount) -
                            Number(payment.fees.amount);

                    transaction.details = [...transaction.details, payment];
                    await transaction.save();

                    if (
                        transaction.amountPaidForDepositWire < transaction.amount ||
                        transaction.status == Status.Completed
                    ) {
                        break;
                    }
                    transaction.status = Status.Completed;
                    await transaction.save();

                    await this.transferToFortress(transaction.sessionId, transaction.owner, transaction.amount);
                    break;
                default:
                    break;
            }
            this.logger.info('[handlePaymentEvent] Deposit fiat transaction info: ', transaction);
            await transaction.save();
        }
        // else {
        //     transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
        //         sessionId: payment.id,
        //     });
        // }

        // if (!transaction) {
        //     this.logger.info(
        //         `[handlePaymentEvent] ${ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND} with sessionId: ${payment.id}`,
        //     );
        //     return;
        // }
        // transaction.details = [...transaction.details, payment];
        // switch (payment.status) {
        //     case CirclePaymentStatus.Failed:
        //         this.logger.info('[handlePaymentEvent] payment status: failed');
        //         transaction.status = Status.Failed;
        //         break;
        //     case CirclePaymentStatus.Confirmed:
        //         transaction.status = Status.Completed;
        //         const amountAfterFee = (Number(payment.amount?.amount) - Number(payment.fees?.amount)).toString();
        //         await this.transferToFortress(payment, transaction.owner, amountAfterFee);
        //         break;
        //     case CirclePaymentStatus.Paid:
        //         if (!isWireBank) {
        //             break;
        //         }
        //
        //         if (payment.amount && payment.amount.amount && payment.fees && payment.fees.amount)
        //             transaction.amountPaidForDepositWire = (
        //                 Number(transaction.amountPaidForDepositWire) +
        //                 Number(payment.amount.amount) -
        //                 Number(payment.fees.amount)
        //             ).toString();
        //
        //         transaction.details = [...transaction.details, payment];
        //
        //         if (transaction.amountPaid < transaction.amount) {
        //             break;
        //         }
        //         transaction.status = Status.Completed;
        //         await this.transferToFortress(payment, transaction.owner, transaction.amount);
        //         break;
        //     default:
        //         break;
        // }
        // this.logger.info('[handlePaymentEvent] Deposit fiat transaction info: ', transaction);
        // await transaction.save();
    };

    async transferToFortress(previouspaymentId: any, ownerId: string, amount: number) {
        const masterWallet = await this.getMasterWallet();
        if (!masterWallet) this.logger.error('[transferToFortress] function getMasterWallet is failed ');

        const walletDb = await this.walletService.getOwnerWallet(ownerId);
        if (!walletDb)
            this.logger.error('[transferToFortress] function getOwnerWallet is failed, wrong input ', ownerId);
        this.logger.info('[transferToFortress] get wallet in Db: ', walletDb);
        const data = {
            idempotencyKey: uuidv4(),
            source: {
                type: ECircleType.Wallet,
                id: masterWallet.data.payments?.masterWalletId,
            },
            destination: {
                type: ECircleType.Blockchain,
                address: walletDb.fortressWalletAddress,
                chain: EChain.MATIC,
            },
            amount: {
                currency: Currency.Usd,
                amount: String(amount),
            },
        };
        const transfer = await this.walletTransfer(data);
        if (!transfer) this.logger.error('[transferToFortress] function walletTransfer is failed, wrong input ', data);

        const circleToFortressTx =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                owner: ownerId,
                action: Action.TransferCircleToFortress,
                status: Status.Processing,
                paymentType: PaymentType.Circle,
                currencyType: CurrencyType.Fiat,
                transferType: ETransferType.CRYPTO,
                amount: amount,
                currency: Currency.Usd,
                sessionId: transfer.data.id,
                previousSessionId: previouspaymentId,
                details: transfer.data,
            });
        await circleToFortressTx.save();
        this.logger.info('[transferToFortress] payment status: Completed');
    }

    handlePaymentIntentEvent = async (data: any) => {
        const { paymentIntent } = data;
        const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
            sessionId: paymentIntent.id,
        });
        if (!transaction) {
            this.logger.info(
                `[handlePaymentIntentEvent] ${ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND} with sessionId: ${paymentIntent.id}`,
            );
            return;
        }
        this.logger.info('[handlePaymentIntentEvent] Get transaction from DB: ', transaction);
        transaction.details = [...transaction.details, paymentIntent];
        if (transaction.action === Action.Deposit) {
            const currentStage = paymentIntent.timeline[0];
            switch (currentStage.status) {
                case CirclePaymentIntentStatus.Complete:
                    if (transaction.status !== Status.Canceled) {
                        transaction.status = Status.Completed;
                    }
                    break;
                case CirclePaymentIntentStatus.Expired:
                    transaction.status = Status.Failed;
                    break;
                default:
                    break;
            }
        }
        await transaction.save();
    };

    handlePayoutsEvent = async (data: any) => {
        const { payout } = data;
        if (payout?.destination?.type === 'wire') {
            this.logger.info('[handlePayoutsEvent] Circle event info: ', payout);
            const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne(
                {
                    sessionId: payout.destination.id,
                },
            );
            let notify;

            switch (payout.status) {
                case CirclePayoutStatus.Complete:
                    transaction.status = Status.Completed;
                    this.logger.info('[handlePayoutsEvent] Withdraw WireBank transaction complete info: ', transaction);
                    transaction.details = [...transaction.details, payout];
                    await transaction.save();

                    await this.walletService.updateStatusWalletTransaction(
                        transaction.txHash,
                        EStatusTransaction.SUCCESS,
                        EAction.WITHDRAW,
                    );

                    notify = {
                        ownerId: transaction.owner,
                        data: {
                            message: NOTIFY_MESSAGE.WITHDRAW_SUCCESS(),
                            ref: transaction._id,
                        },
                        type: ENotifyType.WITHDRAW,
                    };
                    await this.notifyService.create(notify);
                    break;
                case CirclePayoutStatus.Failed:
                    transaction.status = Status.Failed;
                    this.logger.info('[handlePayoutsEvent] Withdraw WireBank transaction failed info: ', transaction);
                    await transaction.save();
                    notify = {
                        ownerId: transaction.owner,
                        data: {
                            message: NOTIFY_MESSAGE.WITHDRAW_FAILED(),
                            ref: transaction._id,
                        },
                        type: ENotifyType.WITHDRAW,
                    };
                    await this.notifyService.create(notify);
                    break;
                default:
                    break;
            }
        }
    };

    handleTransferEvent = async (data: any) => {
        const { transfer } = data;
        if (transfer.source?.type === ETransferSourceType.Blockchain) {
            // Transfer from Blockchain to Circle
            // Handle Transfer Fortress to Circle
            const transferFortressToCircle =
                await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                    txHash: transfer.transactionHash,
                    action: Action.TransferFortressToCircle,
                });

            if (!transferFortressToCircle) {
                this.logger.info(
                    `[handleTransferEvent] ${ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND} with txHash: ${transfer.transactionHash}`,
                );
                return;
            }
            const transferCircleToWirebank =
                await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                    previousSessionId: transferFortressToCircle.sessionId,
                });

            if (!transferCircleToWirebank) {
                this.logger.error(
                    `[handleTransferEvent] Find FortressToCircleTransaction but can't find CircleToWireBankTransaction (parent transaction), findKey: previousSessionId  `,
                    transferFortressToCircle.sessionId,
                );
                return;
            }

            switch (transfer.status) {
                case CirclePaymentStatus.Failed:
                    this.logger.info('[handleTransferEvent] transfer status: failed');
                    transferCircleToWirebank.status = Status.Failed;
                    transferCircleToWirebank.details = [...transferCircleToWirebank.details, transfer];
                    await transferCircleToWirebank.save();
                    break;
                case CirclePaymentStatus.Complete:
                    this.logger.info('[handleTransferEvent] transfer status: Completed');
                    transferCircleToWirebank.details = [...transferCircleToWirebank.details, transfer];
                    await transferCircleToWirebank.save();
                    await this.withdrawMoneyFromCircleToWireBank(transferCircleToWirebank.sessionId);
                    break;
                default:
                    break;
            }
        } else {
            // Transfer from Circle
            const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne(
                {
                    sessionId: transfer.id,
                },
            );
            if (!transaction) {
                this.logger.info(
                    `[handleTransferEvent] ${ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND} with sessionId: ${transfer.id}`,
                );
                return;
            }
            transaction.details = [...transaction.details, transfer];
            let notify;
            const ownerWallet = await this.walletService.getOwnerWallet(transaction.owner);
            switch (transfer.status) {
                case CirclePaymentStatus.Failed:
                    this.logger.info('[handleTransferEvent] payment status: failed');
                    transaction.status = Status.Failed;
                    notify = {
                        ownerId: transaction.owner,
                        data: {
                            message: NOTIFY_MESSAGE.DEPOSIT_FAILED(),
                            ref: transaction._id,
                        },
                        type: ENotifyType.DEPOSIT,
                    };
                    await this.notifyService.create(notify);
                    await this.walletTransactionRepository.createWalletTransaction({
                        walletId: ownerWallet._id,
                        txHash: transfer.transactionHash,
                        amount: transfer.amount.amount.toString(),
                        action: EAction.DEPOSIT,
                        status: EStatusTransaction.FAILED,
                        sourceType: ESourceType.CIRCLE,
                    });
                    break;
                case CirclePaymentStatus.Complete:
                    transaction.status = Status.Completed;
                    transaction.txHash = transfer.transactionHash;
                    notify = {
                        ownerId: transaction.owner,
                        data: {
                            message: NOTIFY_MESSAGE.DEPOSIT_SUCCESS(),
                            ref: transaction._id,
                        },
                        type: ENotifyType.DEPOSIT,
                    };
                    await this.notifyService.create(notify);
                    await this.walletTransactionRepository.createWalletTransaction({
                        walletId: ownerWallet._id,
                        txHash: transfer.transactionHash,
                        amount: transfer.amount.amount.toString(),
                        action: EAction.DEPOSIT,
                        status: EStatusTransaction.SUCCESS,
                        sourceType: ESourceType.CIRCLE,
                    });
                    this.logger.info('[handleTransferEvent] payment status: Completed');
                    break;
                default:
                    break;
            }
            this.logger.info('[handleTransferEvent] Transfer transaction info: ', transaction);
            await transaction.save();
        }
    };

    async withdrawMoneyFromCircleToWireBank(sessionId: string) {
        try {
            const withdrawCircleToWirebank =
                await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                    sessionId: sessionId,
                });

            // Get circle wallet 's address
            let walletOfOwner;
            try {
                walletOfOwner = await this.walletService.getOwnerWallet(withdrawCircleToWirebank.owner);
            } catch (error) {
                this.logger.error(
                    `[withdrawMoneyFromCircleToWireBank] [ownerId: ${withdrawCircleToWirebank.owner}] function getOwnerWallet is failed, error: `,
                    error,
                );
                withdrawCircleToWirebank.status = Status.Failed;
                withdrawCircleToWirebank.failReason = [
                    ...withdrawCircleToWirebank.failReason,
                    ErrorConstant.PAYMENT.GET_OWNER_WALLET_FAILED,
                ];
                await withdrawCircleToWirebank.save();
            }
            const circleWalletId = walletOfOwner.circleWalletId;

            // Create withdraw wire bank
            const amountAfterFee = Number(withdrawCircleToWirebank.amount) - this.feeWhenWithdrawCircle;
            const bankId = withdrawCircleToWirebank.sessionId;

            const data: ICreatePayout = {
                idempotencyKey: v4(),
                source: {
                    type: 'wallet',
                    id: circleWalletId,
                },
                destination: {
                    type: ETypePayout.WIRE,
                    id: bankId,
                },
                amount: {
                    amount: String(amountAfterFee),
                    currency: EPayoutCurrency.USD,
                },
                metadata: withdrawCircleToWirebank.withdrawInput.metadata,
            };
            this.logger.info(
                `[withdrawMoneyFromCircleToWireBank] [ownerId: ${withdrawCircleToWirebank.owner}] function createWithdraw 's input: `,
                data,
            );

            let payout;
            try {
                payout = await this.createWithdraw(data);
            } catch (error) {
                this.logger.error(
                    `[withdrawMoneyFromCircleToWireBank] [ownerId: ${withdrawCircleToWirebank.owner}] function createWithdraw is failed, wrong input and error: `,
                    data,
                    error,
                );
                withdrawCircleToWirebank.status = Status.Failed;
                withdrawCircleToWirebank.failReason = [
                    ...withdrawCircleToWirebank.failReason,
                    ErrorConstant.PAYMENT.CREATE_PAYOUT_FROM_CIRCLE_TO_WIRE_FAILED,
                ];
                await withdrawCircleToWirebank.save();
            }

            withdrawCircleToWirebank.details = [...withdrawCircleToWirebank.details, payout.data];
            await withdrawCircleToWirebank.save();

            return payout;
        } catch (error) {
            await this.paymentService.createNotifyWhenWithdrawCircleToWireFailed(error, sessionId);
        }
    }

    handleSettlementEvent = async (data: any) => {
        const settlementId = data.settlement.id;
        const payments = await this.getListPayment({
            settlementId,
        });
        const transactionsActions = [];
        const transactionsToUpdate = [];
        const paymentsIds = payments.data.map(paymentObj => paymentObj.id);
        const paymentsArray = payments.data;
        const transactions = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.find({
            sessionId: { $in: paymentsIds },
        });
        for (const txn of transactions) {
            const tempPaymentArray = paymentsArray.filter((paymentObject: any) => paymentObject.id === txn.sessionId);
            if (!tempPaymentArray.length) {
                return;
            }
            const tempPayment = tempPaymentArray[0];

            txn.details = [...txn.details, tempPayment];
            switch (tempPayment.status) {
                case CirclePaymentStatus.Failed:
                    txn.status = Status.Failed;
                    break;
                case CirclePaymentStatus.Paid:
                    txn.status = Status.Completed;
                    if (txn.action === Action.Deposit) {
                        const amountAfterFee = Number(tempPayment.amount?.amount) - Number(tempPayment.fees?.amount);

                        await this.transferToFortress(tempPayment.id, txn.owner, amountAfterFee);
                    }
                    break;
                default:
                    break;
            }
            transactionsToUpdate.push(txn.save());
        }

        if (transactionsActions.length) {
            await Promise.all(transactionsActions);
        }
        if (transactionsToUpdate.length) {
            await Promise.all(transactionsToUpdate);
        }
    };

    handleEvent = async (eventData: any) => {
        this.logger.info(`[handleEvent] Circle event from queue: `, eventData);
        switch (eventData.notificationType) {
            case CircleNotificationType.Payments:
                this.logger.info('[handleEvent] handle deposit fiat event');
                await this.handlePaymentEvent(eventData);
                break;
            // case CircleNotificationType.PaymentIntents:
            //     this.logger.info('[handleEvent] handle deposit crypto event');
            //     await this.handlePaymentIntentEvent(data);
            //     break;
            case CircleNotificationType.Transfers:
                this.logger.info('[handleEvent] handle transfer event');
                await this.handleTransferEvent(eventData);
                break;
            case CircleNotificationType.Payout:
                this.logger.info('[handleEvent] handle payouts event');
                await this.handlePayoutsEvent(eventData);
                break;
            case CircleNotificationType.Settlements:
                this.logger.info('[handleEvent] handle settlements event');
                await this.handleSettlementEvent(eventData);
                break;
            default:
        }
    };

    subscribeCircleWebhook = async () => {
        try {
            let isSubcriptionExist = false;
            const { data } = await this.axiosInstance.get(CircleConfig.circle.api.notification);
            this.logger.info('[subscribeCircleWebhook] Get Webhook Url from circle', data.data);
            this.logger.info(
                '[subscribeCircleWebhook] Url from .env: ',
                `${this.configService.get(EEnvKey.BACKEND_APIS_DOMAIN)}/payment/event/circle`,
            );
            await data.data.map(async subscriptions => {
                if (
                    subscriptions.endpoint ===
                    `${this.configService.get(EEnvKey.BACKEND_APIS_DOMAIN)}/payment/event/circle`
                ) {
                    isSubcriptionExist = true;
                }
            });
            if (!isSubcriptionExist) {
                const response = await this.axiosInstance.post(
                    CircleConfig.circle.api.notification,
                    {
                        endpoint: `${this.configService.get(EEnvKey.BACKEND_APIS_DOMAIN)}/payment/event/circle`,
                    },
                    {
                        headers: {
                            content_type: 'application/json',
                            accept: 'application/json',
                        },
                    },
                );
                this.logger.info(
                    `[subscribeCircleWebhook] Circle subscribe Webhook success ${JSON.stringify(response.data)}`,
                );
                return;
            }
            this.logger.info('[subscribeCircleWebhook] Circle subcription existed');
        } catch (error) {
            this.logger.error(
                `[subscribeCircleWebhook] Subcribe Circle webhook fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('[subscribeCircleWebhook] Failed to subcribe Circle webhook');
        }
    };

    walletTransfer = async (data: any) => {
        try {
            const response = await this.axiosInstance.post(CircleConfig.circle.api.transfers, data, {
                headers: { content_type: 'application/json' },
            });
            this.logger.info(`[walletTransfer] Transfer data from Circle: `, response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Transfer failed : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error('Failed to transfer wallet');
        }
    };

    async createWireBankAccount(wireBankAccount: CreateBankAccountDto) {
        try {
            const response = await this.axiosInstance.post(CircleConfig.circle.api.bankWire, wireBankAccount, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `Create Circle Wire Bank Account fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Invalid data input to create Circle Wire Bank Account');
        }
    }

    async getWireBankAccount(id: string) {
        try {
            const response = await this.axiosInstance.get(`${CircleConfig.circle.api.bankWire}/${id}`, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `Get Circle Wire Bank Account fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to get Circle Wire Bank Account');
        }
    }

    async getOrderCircleWireBankInstructions(id: string) {
        try {
            const response = await this.axiosInstance.get(`${CircleConfig.circle.api.bankWire}/${id}/instructions`);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Create Circle PaymentWire fails : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error('Failed to Create Circle PaymentWire');
        }
    }

    async createWithdraw(createPayout: ICreatePayout) {
        try {
            const response = await this.axiosInstance.post(CircleConfig.circle.api.createPayout, createPayout, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `Create Circle Withdraw fails : status ${error.response.status}, message ${error.response.statusText}`,
            );
            throw new Error('Failed to create Circle Withdraw fails');
        }
    }

    async getBalanceAccount() {
        try {
            const response = await this.axiosInstance.get(CircleConfig.circle.api.getBalance, {
                headers: { content_type: 'application/json' },
            });
            return response.data;
        } catch (error) {
            this.logger.error(
                `Get Balance fails : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error('Failed to get Balance fails');
        }
    }

    async createWallet(iCreateWallet: ICreateWallet): Promise<ICreateWalletResponse> {
        try {
            const creatWalletID = await this.axiosInstance.post<ICreateWallet, AxiosResponse<ICreateWalletResponse>>(
                CircleConfig.circle.api.wallet,
                iCreateWallet,
                {
                    headers: { content_type: 'application/json' },
                },
            );
            const payloadCreateAddress: IPayloadCreateAddress = {
                currency: CircleConfig.circle.walletAddressOnChain.currency,
                chain: CircleConfig.circle.walletAddressOnChain.chain,
                idempotencyKey: uuidv4(),
            };
            const creatAddressOnChainPolygon = await this.axiosInstance.post<
                ICreateWallet,
                AxiosResponse<ICreateWalletResponse>
            >(CircleConfig.circle.api.walletAddressOnChain(creatWalletID.data.data.walletId), payloadCreateAddress, {
                headers: { content_type: 'application/json' },
            });
            return { data: { ...creatWalletID.data.data, ...creatAddressOnChainPolygon.data.data } };
        } catch (error) {
            this.logger.error(
                `Create wallet failed : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error('Failed to create wallet');
        }
    }

    async getWallet(walletId: string) {
        try {
            const response = await this.axiosInstance.get<ICircleGetWalletResponse>(
                `${CircleConfig.circle.api.wallet}/${walletId}`,
                {
                    headers: { content_type: 'application/json' },
                },
            );
            return response.data;
        } catch (error) {
            this.logger.error(
                `Get User's wallet failed : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error(`Failed to get user's wallet`);
        }
    }

    async getMasterWallet() {
        try {
            const response = await this.axiosInstance.get(CircleConfig.circle.api.configuration, {
                headers: { content_type: 'application/json' },
            });
            this.logger.info('[getMasterWallet] Master wallet inf from Circle: ', response.data);
            return response.data;
        } catch (error) {
            this.logger.error(
                `Get Cirlce Master wallet failed : status ${error.response.status}, message ${error.response.statusText},`,
            );
            throw new Error('Failed to get circle master wallet');
        }
    }
}
