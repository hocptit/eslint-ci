import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateCardDto, CreatePaymentDto, CreatePaymentIntentDto } from './dto/request/payment.dto';
import { CircleService } from '@modules/payment/circle.service';
import { CircleConfig, Currency, EAllCurrency, ECreateWireBankStatus } from '@constants/circle.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { BadRequestException } from '@shared/exception';
import { ErrorConstant } from '@constants/error.constant';
import { PaymentService } from './payment.service';
import { getClientIp } from 'request-ip';
import { OwnerService } from '@modules/owner/owner.service';
import { WithdrawFiatDto } from '@modules/payment/dto/request/withdraw-fiat.dto';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { Action, ETransferType, PaymentType, Status } from '@models/entities/MarketplaceTransaction.entity';
import MarketplaceTransactionRepository from '@models/repositories/MarketplaceTransaction.repository';
import { DepositWireDto } from '@modules/payment/dto/request/deposit-wire.dto';
import { fortressDefaultNetwork } from '@constants/fortress.constant';
import Bluebird from 'bluebird';
import { WalletService } from '@modules/wallet/wallet.service';
import { EAction, EStatusTransaction } from '@models/entities/WalletTransaction.entity';
import { ListTransactionDto } from './dto/request/list-transaction.dto';
import { NOTIFY_MESSAGE } from '@constants/notify-message.constant';
import { ENotifyType } from '@models/entities/Notify.entity';
import { NotifyService } from '@modules/notify/notify.service';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { WithdrawCryptoDto } from './dto/request/withdraw-crypto.dto';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import mongoose from 'mongoose';
import * as exc from '@shared/exception/index';
import WireBankAccountRepository from '@models/repositories/WireBankAccount.repository';
import { EEnvKey } from '@constants/env.constant';
import Bull from 'bull';
import { BullLib } from '@modules/worker/bull.lib';
import { WITHDRAW_MONEY_FROM_FORTRESS_TO_CIRCLE_QUEUE_NAME } from '@constants/bull.constant';
import { IWithdrawMoneyFromFortressToCircle } from '@modules/worker/worker.console';

@Injectable()
export class PaymentUsecase implements OnModuleInit {
    constructor(
        private marketplaceTransactionRepository: MarketplaceTransactionRepository,
        @Inject(forwardRef(() => CircleService)) private readonly circleService: CircleService,
        private loggerService: LoggerService,
        private readonly paymentService: PaymentService,
        private readonly ownerService: OwnerService,
        private readonly wireBankAccountRepository: WireBankAccountRepository,
        private configService: ConfigService,
        private walletService: WalletService,
        private readonly notifyService: NotifyService,
        private web3Service: Web3Service,
        private walletTransactionRepository: WalletTransactionRepository,
    ) {}
    private logger = this.loggerService.getLogger('PaymentUsecase');
    private sleepTime = this.configService.get(EEnvKey.PAYMENT_SLEEP_TIME);
    private maxNumberRepetitions = this.configService.get(EEnvKey.MAX_NUMBER_RETRY);
    private feeWhenWithdrawCircle = this.configService.get(EEnvKey.FEE_WHEN_WITHDRAW_CIRCLE);
    private withdrawFortressToCircleQueue: Bull.Queue<IWithdrawMoneyFromFortressToCircle>;
    async onModuleInit() {
        this.withdrawFortressToCircleQueue = await BullLib.createNewQueue(
            WITHDRAW_MONEY_FROM_FORTRESS_TO_CIRCLE_QUEUE_NAME,
            {
                host: this.configService.get(EEnvKey.REDIS_HOST),
                port: this.configService.get(EEnvKey.REDIS_PORT),
                password: this.configService.get(EEnvKey.REDIS_PASSWORD),
                db: this.configService.get(EEnvKey.REDIS_DB),
            },
        );
    }

    depositCrypto = async (ownerId: string, createPaymentIntent: CreatePaymentIntentDto) => {
        const getOwner = await this.ownerService.getOwner(ownerId);
        const currency = createPaymentIntent.amount.currency;
        if (currency !== Currency.Usd) {
            return await this.paymentService.createCryptoDeposit(getOwner, createPaymentIntent);
        }
        createPaymentIntent.idempotencyKey = v4();
        createPaymentIntent.settlementCurrency = Currency.Usd;
        createPaymentIntent.amount.amount = Number(createPaymentIntent.amount.amount).toFixed(5);
        return await this.paymentService.createCryptoDeposit(getOwner, createPaymentIntent);
    };

    depositByCardCircle = async (ownerId: string, createPaymentDto: CreatePaymentDto, request: Request) => {
        createPaymentDto.amount = {
            amount: createPaymentDto.amount.amount,
            currency: Currency.Usd,
        };
        createPaymentDto.idempotencyKey = v4();
        createPaymentDto.verification = CircleConfig.circle.card.verifycation;
        createPaymentDto.metadata.ipAddress = getClientIp(request);
        createPaymentDto.metadata.sessionId = v4();
        const listCard = await this.ownerService.getOwner(ownerId);
        if (!listCard) {
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.CARD_NOT_FOUND,
            });
        }
        const cards = listCard.circleCardIds;

        const card = cards.filter(cardTemp => cardTemp.cardId === createPaymentDto.source.id);
        if (card.length < 1) {
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.CARD_NOT_FOUND,
            });
        }
        createPaymentDto.keyId = card[0].keyId;

        return await this.paymentService.createCardDeposit(ownerId, createPaymentDto);
    };

    createCard = async (req: Request, createCardDetail: CreateCardDto, ownerId: string) => {
        createCardDetail.metadata.ipAddress = getClientIp(req);
        createCardDetail.keyId = CircleConfig.circle.card.keyId;
        createCardDetail.idempotencyKey = v4();
        createCardDetail.metadata.sessionId = v4();

        const data = await this.circleService.createCard(createCardDetail);
        await this.paymentService.saveCircleCardOwner(ownerId, data.data.id, createCardDetail.keyId);
        return data;
    };

    deleteCard = async (ownerId: string, cardId: string) => {
        return await this.paymentService.removeCircleCardOwner(ownerId, cardId);
    };

    generatePublicKey = async () => {
        return await this.circleService.generatePublicKey();
    };

    getPayment = async (paymentId: string) => {
        return await this.circleService.getPayment(paymentId);
    };

    getPaymentIntent = async (paymentIntentId: string) => {
        return await this.circleService.getPaymentIntents(paymentIntentId);
    };

    getListTransaction = async (ownerId: string, listTransactionDto: ListTransactionDto) => {
        return await this.paymentService.getListTransaction(ownerId, listTransactionDto);
    };

    async createWireBankForDeposit(ownerId: string, depositWireDto: DepositWireDto) {
        // if iban exist, ignore it
        if (depositWireDto.bankData && depositWireDto.bankData.iban) {
            delete depositWireDto.bankData.iban;
        }
        // Create MarketplaceTransaction
        const marketplaceTransaction =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                owner: ownerId,
                action: Action.Deposit,
                status: Status.Processing,
                paymentType: PaymentType.Circle,
                transferType: ETransferType.WIRE,
                amount: depositWireDto.amount,
                currency: EAllCurrency.USD,
            });

        if (!marketplaceTransaction)
            this.logger.error(
                `[createWireBankForDeposit] [ownerId: ${ownerId}] Can't create marketplaceTransaction in database `,
            );

        const bankData = {
            ...depositWireDto.bankData,
            idempotencyKey: v4(),
        };

        // Create Wire bank account. If it has error, log that error and transaction is failed
        let payment;
        try {
            payment = await this.circleService.createWireBankAccount(bankData);
        } catch (error) {
            this.logger.error(
                `[createWireBankForDeposit] [ownerId: ${ownerId}] function createWireBankAccount is failed, wrong input and error `,
                bankData,
                error,
            );
            marketplaceTransaction.status = Status.Failed;
            marketplaceTransaction.failReason = [
                ...marketplaceTransaction.failReason,
                ErrorConstant.PAYMENT.CREATE_WIRE_BANK_FOR_USER_FAILED,
            ];
            await marketplaceTransaction.save();

            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        // Update MarketplaceTransaction
        marketplaceTransaction.sessionId = payment.data.id;
        marketplaceTransaction.createWireBankHistory = [payment.data];
        await marketplaceTransaction.save();

        return { wireBankAccountId: payment.data.id };
    }

    async checkWireBankAndCreateInstruction(ownerId: string, sessionId: string) {
        // Check exist instruction
        const marketplaceTransaction =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                sessionId: sessionId,
            });

        // If it has error, log that error and transaction is failed
        if (!marketplaceTransaction) {
            this.logger.error(
                `[checkWireBankAndCreateInstruction] [ownerId: ${ownerId}] can't find marketplaceTransaction, wrong input sessionId `,
                sessionId,
            );
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        if (marketplaceTransaction && marketplaceTransaction.instruction) {
            return {
                paymentInstruction: marketplaceTransaction.instruction,
                amount: marketplaceTransaction.amount,
                transactionId: marketplaceTransaction._id,
            };
        }

        // Check create wire bank is complete
        const bankAccount = await this.circleService.getWireBankAccount(sessionId);
        if (!bankAccount) {
            this.logger.error(
                `[checkWireBankAndCreateInstruction] [ownerId: ${ownerId}] function getWireBankAccount is failed, wrong input sessionId `,
                sessionId,
            );
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        if (bankAccount?.data?.status === ECreateWireBankStatus.COMPLETE) {
            // Create instruction for bank account. If it has error, log that error and transaction is failed
            let paymentInstruction;
            try {
                paymentInstruction = await this.circleService.getOrderCircleWireBankInstructions(sessionId);
            } catch (error) {
                this.logger.error(
                    `[checkWireBankAndCreateInstruction] [ownerId: ${ownerId}] function getOrderCircleWireBankInstructions is failed, wrong input sessionId `,
                    sessionId,
                    error,
                );
                marketplaceTransaction.status = Status.Failed;
                marketplaceTransaction.failReason = [...marketplaceTransaction.failReason, String(error.message)];
                await marketplaceTransaction.save();
                throw new BadRequestException({
                    message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
                });
            }

            marketplaceTransaction.instruction = paymentInstruction.data;
            marketplaceTransaction.createWireBankHistory = [
                ...marketplaceTransaction.createWireBankHistory,
                bankAccount.data,
            ];
            await marketplaceTransaction.save();
            return {
                paymentInstruction: paymentInstruction.data,
                amount: marketplaceTransaction.amount,
                transactionId: marketplaceTransaction._id,
            };
        } else {
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.PENDING_IN_CREATE_WIRE_BANK,
            });
        }
    }

    async prepareWithdrawByWireBank(ownerId: string, withdrawFiatDto: WithdrawFiatDto) {
        // Check balance in Fortress
        const balanceOwnerFortress = await this.walletService.getBalanceUSDCOfOwner(ownerId);

        // $25 is fee that need for withdraw from circle to wire bank
        if (Number(balanceOwnerFortress) <= 25) {
            this.logger.warn(
                `[prepareWithdrawByWireBank] [ownerId: ${ownerId}] balanceOwnerFortress: `,
                balanceOwnerFortress,
            );
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.BALANCE_IS_NOT_ENOUGH_MONEY,
            });
        }

        if (Number(withdrawFiatDto.amount) <= 25)
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });

        // Create Wire bank account and create a transaction
        const wireBank = await this.createWireBankForWithdraw(ownerId, withdrawFiatDto);
        if (!wireBank)
            this.logger.error(
                `[checkWireBankAndCreateInstruction] [ownerId: ${ownerId}] function createWireBankForWithdraw is failed, wrong input `,
                ownerId,
                withdrawFiatDto,
            );

        return { sessionId: wireBank.data.id, bankData: wireBank };
    }

    async createWireBankForWithdraw(ownerId: string, withdrawFiatDto: WithdrawFiatDto) {
        // if iban exist, ignore it
        if (withdrawFiatDto.bankData && withdrawFiatDto.bankData.iban) {
            delete withdrawFiatDto.bankData.iban;
        }
        // Create MarketplaceTransaction
        const marketplaceTransaction =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                owner: ownerId,
                action: Action.Withdraw,
                status: Status.Processing,
                paymentType: PaymentType.Circle,
                transferType: ETransferType.WIRE,
                amount: withdrawFiatDto.amount,
                currency: EAllCurrency.USD,
                withdrawInput: withdrawFiatDto,
            });

        const bankData = {
            ...withdrawFiatDto.bankData,
            idempotencyKey: v4(),
        };

        // Create Wire bank account
        let wireBank;
        try {
            wireBank = await this.circleService.createWireBankAccount(bankData);
        } catch (error) {
            this.logger.error(
                `[createWireBankForWithdraw] [ownerId: ${ownerId}] function createWireBankAccount is failed, wrong input and error `,
                bankData,
                error,
            );
            marketplaceTransaction.status = Status.Failed;
            marketplaceTransaction.failReason = [
                ...marketplaceTransaction.failReason,
                ErrorConstant.PAYMENT.CREATE_WIRE_BANK_FOR_USER_FAILED,
            ];
            await marketplaceTransaction.save();

            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        const transaction = await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
            sessionId: wireBank.data.id,
        });

        if (transaction)
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.TRANSACTION_WITHDRAW_IS_EXIST,
            });

        // Update MarketplaceTransaction
        marketplaceTransaction.sessionId = wireBank.data.id;
        marketplaceTransaction.createWireBankHistory = [wireBank.data];
        await marketplaceTransaction.save();

        return wireBank;
    }

    async checkPrepareAndStartWithdraw(ownerId: string, sessionId: string) {
        // Get transaction
        const withdrawCircleToWirebank =
            await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                sessionId: sessionId,
            });
        if (!withdrawCircleToWirebank) {
            this.logger.error(
                `[checkPrepareAndStartWithdraw] [ownerId: ${ownerId}] can't find withdrawCircleToWirebank with sessionId `,
                sessionId,
            );
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        // Check prepares for withdraw was done
        if (withdrawCircleToWirebank.prepareWithdrawStatus === true)
            return {
                prepareStatus: Status.Completed,
                withdrawStatus: Status.Processing,
                transactionId: withdrawCircleToWirebank._id,
            };

        // Check create wire bank is complete
        const bankAccount = await this.circleService.getWireBankAccount(sessionId);
        if (!bankAccount) {
            this.logger.error(
                `[checkPrepareAndStartWithdraw] [ownerId: ${ownerId}] function getWireBankAccount is failed, wrong input sessionId `,
                sessionId,
            );
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.INVALID_DATA_INPUT,
            });
        }

        // Handle if create Wire bank account for user is complete
        if (bankAccount?.data?.status === ECreateWireBankStatus.COMPLETE) {
            // Update detail and create instruction in marketplaceTransaction
            withdrawCircleToWirebank.createWireBankHistory = [
                ...withdrawCircleToWirebank.createWireBankHistory,
                bankAccount.data,
            ];
            withdrawCircleToWirebank.prepareWithdrawStatus = true;
            await withdrawCircleToWirebank.save();

            await this.withdrawFortressToCircleQueue.add(
                {
                    ownerId: ownerId,
                    sessionId: sessionId,
                    withdrawFiatDto: withdrawCircleToWirebank.withdrawInput,
                },
                {
                    attempts: 5,
                    backoff: {
                        type: 'fixed',
                        delay: 1000 * 60 * 2,
                    },
                    removeOnFail: false,
                    removeOnComplete: {
                        age: 60 * 60 * 24,
                    },
                },
            );

            return {
                prepareStatus: Status.Completed,
                withdrawStatus: Status.Processing,
                transactionId: withdrawCircleToWirebank._id,
            };
        }

        // Handle if create Wire bank account for user is failed
        if (bankAccount?.data?.status === ECreateWireBankStatus.FAILED) {
            // Update detail in marketplaceTransaction
            withdrawCircleToWirebank.createWireBankHistory = [
                ...withdrawCircleToWirebank.createWireBankHistory,
                bankAccount.data,
            ];
            withdrawCircleToWirebank.failReason = [
                ...withdrawCircleToWirebank.failReason,
                ErrorConstant.PAYMENT.CREATE_WIRE_BANK_FOR_USER_FAILED,
            ];
            withdrawCircleToWirebank.status = Status.Failed;
            await withdrawCircleToWirebank.save();

            await this.paymentService.createWalletTransactionFailedWhenWithdrawFailed(
                ownerId,
                withdrawCircleToWirebank,
            );

            return {
                prepareStatus: Status.Failed,
                withdrawStatus: Status.Failed,
                transactionId: withdrawCircleToWirebank._id,
            };
        }

        // Default message if create wire bank for users is still pending
        return {
            prepareStatus: Status.Processing,
            withdrawStatus: Status.Processing,
            transactionId: withdrawCircleToWirebank._id,
        };
    }

    async withdrawMoneyFromFortressToCircle(ownerId: string, sessionId: string, withdrawFiatDto: WithdrawFiatDto) {
        try {
            // Get transaction
            const circleToWireTransaction =
                await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.findOne({
                    sessionId: sessionId,
                });

            // Get circle wallet 's address
            let walletOfOwner;
            try {
                walletOfOwner = await this.walletService.getOwnerWallet(ownerId);
            } catch (error) {
                this.logger.error(
                    `[withdrawMoneyFromFortressToCircle] [ownerId: ${ownerId}] function getOwnerWallet is failed, wrong input and error: `,
                    ownerId,
                    error,
                );
                circleToWireTransaction.status = Status.Failed;
                circleToWireTransaction.failReason = [
                    ...circleToWireTransaction.failReason,
                    ErrorConstant.PAYMENT.GET_OWNER_WALLET_FAILED,
                ];
                await circleToWireTransaction.save();
            }

            // Create Transaction from Fortress to Circle in MarketplaceTransaction
            const fortressToCircleTransaction =
                await this.marketplaceTransactionRepository.marketplaceTransactionDocumentModel.create({
                    owner: ownerId,
                    action: Action.TransferFortressToCircle,
                    status: Status.Processing,
                    paymentType: PaymentType.Fortress,
                    transferType: ETransferType.CRYPTO,
                    amount: withdrawFiatDto.amount,
                    currency: EAllCurrency.USDC,
                });

            this.logger.info(
                `[withdrawMoneyFromFortressToCircle] [ownerId: ${ownerId}] function transferUsdcToAddress 's' input: `,
                ownerId,
                walletOfOwner.circleAddressOnPolygon,
                withdrawFiatDto.amount.toString(),
                fortressDefaultNetwork[0].chain,
            );
            let walletTransaction;
            try {
                walletTransaction = await this.walletService.transferUsdcToAddress(
                    ownerId,
                    walletOfOwner.circleAddressOnPolygon,
                    withdrawFiatDto.amount.toString(),
                    fortressDefaultNetwork[0].chain,
                );
            } catch (error) {
                this.logger.error(
                    `[withdrawMoneyFromFortressToCircle] [ownerId: ${ownerId}] function transferUsdcToAddress is failed, wrong input and error  `,
                    ownerId,
                    walletOfOwner.circleAddressOnPolygon,
                    withdrawFiatDto.amount.toString(),
                    fortressDefaultNetwork[0].chain,
                    error,
                );
                circleToWireTransaction.status = Status.Failed;
                circleToWireTransaction.failReason = [
                    ...circleToWireTransaction.failReason,
                    ErrorConstant.PAYMENT.CREATE_TRANSFER_USDC_FROM_FORTRESS_TO_CIRCLE_FAILED,
                ];
                await circleToWireTransaction.save();
                await this.paymentService.createWalletTransactionFailedWhenWithdrawFailed(
                    ownerId,
                    circleToWireTransaction,
                );
            }

            // Update Transaction from Fortress to Circle in MarketplaceTransaction
            fortressToCircleTransaction.details = [walletTransaction];
            fortressToCircleTransaction.sessionId = walletTransaction._id;
            fortressToCircleTransaction.txHash = walletTransaction.txHash;
            await fortressToCircleTransaction.save();

            // Add fortressToCircleTransaction 's sessionId to circleToWireTransaction's previousSessionId
            circleToWireTransaction.previousSessionId = fortressToCircleTransaction.sessionId;
            circleToWireTransaction.txHash = walletTransaction.txHash;
            await circleToWireTransaction.save();

            // Check status of fortressToCircleTransaction
            let numberRepetitions = 0;
            let isCheck = true;
            while (isCheck) {
                // Use web3 to check status of transaction and update wallet transaction
                const txReceipt = await this.web3Service.getTransactionReceipt(walletTransaction.txHash);

                if (txReceipt && txReceipt.status === true) {
                    await this.walletService.updateStatusWalletTransaction(
                        walletTransaction.txHash,
                        EStatusTransaction.PENDING,
                        EAction.WITHDRAW,
                    );

                    // Update Transaction Status from Fortress to Circle Success
                    fortressToCircleTransaction.details = [...fortressToCircleTransaction.details, txReceipt];
                    fortressToCircleTransaction.status = Status.Completed;
                    await fortressToCircleTransaction.save();
                    return;
                }
                if (txReceipt && txReceipt.status === false) {
                    await this.walletService.updateStatusWalletTransaction(
                        walletTransaction.txHash,
                        EStatusTransaction.FAILED,
                        EAction.WITHDRAW,
                    );
                }

                // Get transaction after update
                const walletTransactionByTxHash = await this.walletService.getWalletTransactionByTxHash(
                    walletTransaction.txHash,
                );
                if (!walletTransactionByTxHash)
                    this.logger.error(
                        `[withdrawMoneyFromFortressToCircle] [ownerId: ${ownerId}] function getWalletTransactionByTxHash is failed, wrong txHash `,
                        walletTransaction.txHash,
                    );

                if (walletTransactionByTxHash.status === EStatusTransaction.FAILED) {
                    // Update Transaction Status from Fortress to Circle Failed
                    fortressToCircleTransaction.details = [
                        ...fortressToCircleTransaction.details,
                        walletTransactionByTxHash,
                    ];
                    fortressToCircleTransaction.status = Status.Failed;
                    await fortressToCircleTransaction.save();

                    // Update Transaction Status from Circle to WireBank Failed
                    circleToWireTransaction.status = Status.Failed;
                    await circleToWireTransaction.save();
                    return;
                }
                await Bluebird.delay(this.sleepTime);
                numberRepetitions++;
                if (numberRepetitions > this.maxNumberRepetitions) isCheck = false;
            }

            // Send Notification Fall after NumberRepetitions is Max and can't check status
            if (isCheck === false)
                await this.paymentService.createNotifyWhenWithdrawFortressToCircleFailed(
                    ErrorConstant.PAYMENT.TIME_OUT,
                    sessionId,
                );
        } catch (error) {
            // Send notification failed
            await this.paymentService.createNotifyWhenWithdrawFortressToCircleFailed(error, sessionId);
        }
    }

    async withdrawCrypto(ownerId: string, withdrawCryptoDto: WithdrawCryptoDto) {
        // Check balance in Fortress
        const web3 = await this.web3Service.getWeb3();
        const checkAddress = web3.utils.isAddress(withdrawCryptoDto.walletAddress);
        if (!checkAddress) {
            throw new exc.BadRequestException({ message: ErrorConstant.PAYMENT.INVALID_WALLET_ADDRESS });
        }
        const balanceOwnerFortress = await this.walletService.getBalanceUSDCOfOwner(ownerId);

        if (Number(balanceOwnerFortress) < Number(withdrawCryptoDto.amount))
            throw new BadRequestException({
                message: ErrorConstant.PAYMENT.BALANCE_IS_NOT_ENOUGH_MONEY,
            });

        // Create Transfer Fortress to user's wallet
        const walletTransaction = await this.walletService.transferUsdcToAddress(
            ownerId,
            withdrawCryptoDto.walletAddress,
            withdrawCryptoDto.amount.toString(),
            fortressDefaultNetwork[0].chain,
        );
        // Check status of fortressToCircleTransaction
        let numberRepetitions = 0;
        let isCheck = true;
        while (isCheck) {
            // Use web3 to check status of transaction and update wallet transaction
            const txReceipt = await this.web3Service.getTransactionReceipt(walletTransaction.txHash);
            if (txReceipt && txReceipt.status === true) {
                await this.walletService.updateStatusWalletTransaction(
                    walletTransaction.txHash,
                    EStatusTransaction.SUCCESS,
                    EAction.WITHDRAW,
                );
                const notify = {
                    ownerId: ownerId,
                    data: {
                        message: NOTIFY_MESSAGE.WITHDRAW_SUCCESS(),
                        ref: walletTransaction._id,
                    },
                    type: ENotifyType.WITHDRAW,
                };
                await this.notifyService.create(notify);
                return this.walletTransactionRepository.walletTransactionDocumentModel.findOne({
                    txHash: walletTransaction.txHash,
                });
            } else if (txReceipt && txReceipt.status === false) {
                await this.walletService.updateStatusWalletTransaction(
                    walletTransaction.txHash,
                    EStatusTransaction.FAILED,
                    EAction.WITHDRAW,
                );
                const notify = {
                    ownerId: ownerId,
                    data: {
                        message: NOTIFY_MESSAGE.WITHDRAW_FAILED(),
                        ref: walletTransaction._id,
                    },
                    type: ENotifyType.WITHDRAW,
                };
                await this.notifyService.create(notify);
                return this.walletTransactionRepository.walletTransactionDocumentModel.findOne({
                    txHash: walletTransaction.txHash,
                });
            }
            await Bluebird.delay(this.sleepTime);
            numberRepetitions++;
            if (numberRepetitions > this.maxNumberRepetitions) isCheck = false;
        }
    }

    checkTransactionComplete = async (id: string) => {
        let data;
        const walletTransaction = await this.walletTransactionRepository.walletTransactionDocumentModel.findById(
            new mongoose.Types.ObjectId(id),
        );
        if (walletTransaction) {
            data = {
                status: Status.Completed,
                amount: walletTransaction.amount,
                currency: Currency.Usd,
            };
            return data;
        } else {
            const firstTransaction = await this.paymentService.getTransactionById(id);
            if (!firstTransaction) {
                throw new BadRequestException({ message: ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND });
            }

            if (firstTransaction.action === Action.Withdraw && firstTransaction.transferType === ETransferType.WIRE) {
                data = {
                    status: firstTransaction.status,
                    amount: Number(firstTransaction.amount) - this.feeWhenWithdrawCircle,
                    currency: firstTransaction.currency,
                };
                return data;
            }
            data = {
                status: firstTransaction.status,
                amount: firstTransaction.amount,
                currency: firstTransaction.currency,
            };
            if (firstTransaction.status === Status.Completed) {
                const secondTransaction = await this.paymentService.getTransactionByPreviousSessionId(
                    firstTransaction.sessionId,
                );
                if (!secondTransaction) {
                    throw new BadRequestException({ message: ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND });
                }
                if (secondTransaction.action === Action.TransferCircleToFortress) {
                    data = {
                        status: secondTransaction.status,
                        amount: secondTransaction.amount,
                        currency: secondTransaction.currency,
                    };
                    return data;
                }
            }
            return data;
        }
    };

    getTransactionById = async (id: string) => {
        const transaction = await this.paymentService.getTransactionById(id);
        if (!transaction) {
            throw new BadRequestException({ message: ErrorConstant.PAYMENT.TRANSACTION_NOT_FOUND });
        }
        return transaction;
    };

    async getCircleCardById(cardId: string) {
        return await this.circleService.getCardInfo(cardId);
    }
}
