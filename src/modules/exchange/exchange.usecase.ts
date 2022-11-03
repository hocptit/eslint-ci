import {
    EExchangeStatus,
    EExchangeType,
    EOrderStatus,
    EOrderType,
    EUserStatusInExchange,
} from '@constants/exchange.constant';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { BidDto, CreateAuctionExchangeDto, CreateFixedPriceExchangeDto, GetExchangesDto } from './dto/exchange.dto';
import { ExchangeService } from './exchange.service';
import * as exc from '@shared/exception/index';
import { ErrorConstant } from '@constants/error.constant';
import { formatResponseSuccess, getUnixTimestamp } from '@shared/utils/format';
import { CurrentUser } from '@shared/decorators/auth.decorator';
import { OwnerService } from '@modules/owner/owner.service';
import { NftService } from '@modules/nft/nft.service';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { fortressDefaultNetwork } from '@constants/fortress.constant';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { ExchangeDocument } from '@models/entities/Exchange.entity';
import { WalletService } from '@modules/wallet/wallet.service';
import { IWeb3Event } from '@modules/nft/interface';
import { ENftStatus } from '@models/entities/Nft.entity';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { ListMyActiveBidDto } from '@modules/exchange/dto/list-my-active-bid.dto';
import BigNumber from 'bignumber.js';
import { EAction, ESourceType, EStatusTransaction } from '@models/entities/WalletTransaction.entity';
import Bluebird from 'bluebird';
import { RoundRobinService } from './providers/round-robin.service';
import { OrderDocument } from '@models/entities/Order.entity';
import { EExchangeAction } from '@modules/worker/worker.console';
import Bull from 'bull';
import { BullLib } from '@modules/worker/bull.lib';
import { FORTRESS_SEND_TX_QUEUE_NAME } from '@constants/bull.constant';

@Injectable()
export class ExchangeUseCase implements OnModuleInit {
    constructor(
        public readonly exchangeService: ExchangeService,
        private loggerService: LoggerService,
        private ownerService: OwnerService,
        private nftService: NftService,
        private walletService: WalletService,
        private web3Service: Web3Service,
        private configService: ConfigService,
        private roundRobinService: RoundRobinService,
    ) {}
    private usdcDecimals = this.configService.get<string>(EEnvKey.USDC_DECIMAL);

    async onModuleInit() {
        this.transactionQueue = await BullLib.createNewQueue(FORTRESS_SEND_TX_QUEUE_NAME, {
            host: this.configService.get(EEnvKey.REDIS_HOST),
            port: this.configService.get(EEnvKey.REDIS_PORT),
            password: this.configService.get(EEnvKey.REDIS_PASSWORD),
            db: this.configService.get(EEnvKey.REDIS_DB),
        });
    }

    private logger = this.loggerService.getLogger('exchange');
    private web3 = this.web3Service.getWeb3();
    private nftContractAddress = this.configService.get<string>(EEnvKey.NFT_CONTRACT_ADDRESS);
    private usdcAddress = this.configService.get<string>(EEnvKey.USDC_CONTRACT_ADDRESS);
    private nftMarketContractAddress = this.configService.get<string>(EEnvKey.EXCHANGE_CONTRACT_ADDRESS);
    private gasLimit = this.configService.get<number>(EEnvKey.GAS_LIMIT);
    private transactionQueue: Bull.Queue;

    async createFixedPriceExchange(data: CreateFixedPriceExchangeDto, @CurrentUser() user: IPayloadUserJwt) {
        const { price, nftId } = data;
        const { userId } = user;

        // check owner of token id
        const ownerOfToken = await this.nftService.getOwnerNft(nftId.toString());

        const sellerWallet = await this.walletService.getOwnerWallet(userId);

        if (sellerWallet.fortressWalletAddress !== ownerOfToken) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.YOU_ARE_NOT_OWNER_OF_NFT,
            });
        }

        const existingExchange = await this.exchangeService.getPendingOrOpenExchange({
            nftId,
            userId,
        });

        if (existingExchange) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.EXCHANGE_ALREADY_EXIST,
            });
        }

        const dataToBeCreated = {
            nftId,
            price,
            sellerId: userId,
            nftAddress: this.nftContractAddress,
            erc20Address: this.usdcAddress,
            type: EExchangeType.SELL,
            status: EExchangeStatus.PENDING_TRANSACTION,
        };

        const exchange = await this.exchangeService.createFixedPriceExchange(dataToBeCreated);

        // push to queue
        await this.transactionQueue.add(
            { data: exchange, actions: EExchangeAction.CREATE_LISTING },
            {
                jobId: `${exchange._id}_${EExchangeAction.CREATE_LISTING}`,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 1000 * 60,
                },
                removeOnFail: false,
                removeOnComplete: {
                    age: 60 * 60 * 24,
                },
            },
        );

        this.logger.info('[Create fixed price exchange]', exchange);

        return formatResponseSuccess({ data: exchange, message: 'Fixed price exchange created!' });
    }

    async createFixedPriceExchangeQueueHandler(exchange: ExchangeDocument) {
        const { nftId, price, sellerId } = exchange;
        // approve token to exchange contract
        const { txHash } = await this.walletService.approveNftForSC(
            sellerId,
            nftId.toString(),
            fortressDefaultNetwork[0].chain,
        );

        // wait for transaction to be mined
        while (true) {
            const tx = await this.web3.eth.getTransactionReceipt(txHash);
            if (tx && tx?.status) {
                await this.walletService.updateStatusWalletTransaction(
                    txHash,
                    EStatusTransaction.SUCCESS,
                    EAction.APPROVE_NFT,
                );
                break;
            }
            await Bluebird.delay(1000);
        }

        // admin call the function to create exchange
        const adminPrivateKey = this.roundRobinService.getAdminPrivateKey().value;
        const adminWallet = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);

        const sellerWallet = await this.walletService.getOwnerWallet(sellerId);

        // get transaction data
        const txData = await this.web3Service.sellNft(
            nftId,
            new BigNumber(price).multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString(),
            this.usdcAddress,
            sellerWallet.fortressWalletAddress,
            this.nftContractAddress,
        );

        // sign transaction
        const signedTx = await adminWallet.signTransaction({
            from: adminWallet.address,
            to: this.nftMarketContractAddress,
            data: txData,
            gas: this.gasLimit,
            gasPrice: await this.web3.eth.getGasPrice(),
        });
        // send transaction
        await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async createAuctionExchange(data: CreateAuctionExchangeDto, user: IPayloadUserJwt) {
        const { nftId, auctionStartAt, auctionEndAt, price } = data;
        const { userId } = user;

        // make sure the start auction time is greater than current time and end auction time is greater than start auction time
        if (auctionStartAt < getUnixTimestamp() || auctionEndAt < auctionStartAt) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.INVALID_AUCTION_TIME,
            });
        }

        // check owner of token
        const ownerOfToken = await this.nftService.getOwnerNft(nftId.toString());
        const auctionerWallet = await this.walletService.getOwnerWallet(userId);
        if (auctionerWallet.fortressWalletAddress !== ownerOfToken) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.YOU_ARE_NOT_OWNER_OF_NFT,
            });
        }

        const existingExchange = await this.exchangeService.getPendingOrOpenExchange({
            nftId,
            userId,
        });

        if (existingExchange) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.EXCHANGE_ALREADY_EXIST,
            });
        }

        const dataToBeCreated = {
            nftId,
            price,
            sellerId: userId,
            nftAddress: this.nftContractAddress,
            erc20Address: this.usdcAddress,
            type: EExchangeType.AUCTION,
            status: EExchangeStatus.PENDING_TRANSACTION,
            auctionStartAt,
            auctionEndAt,
        };

        const exchange = await this.exchangeService.createAuctionExchange(dataToBeCreated);

        // push to queue
        await this.transactionQueue.add(
            { data: exchange, actions: EExchangeAction.CREATE_AUCTION },
            {
                jobId: `${exchange._id}_${EExchangeAction.CREATE_AUCTION}`,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 1000 * 60,
                },
                removeOnFail: false,
                removeOnComplete: {
                    age: 60 * 60 * 24,
                },
            },
        );

        this.logger.info('[Create auction exchange]', exchange);

        return formatResponseSuccess({ data: exchange, message: 'Auction exchange created!' });
    }

    async createAuctionExchangeQueueHandler(exchange: ExchangeDocument) {
        const { nftId, price, sellerId } = exchange;
        // approve token to exchange contract
        const { txHash } = await this.walletService.approveNftForSC(
            sellerId,
            nftId.toString(),
            fortressDefaultNetwork[0].chain,
        );

        // wait for transaction to be mined
        while (true) {
            const tx = await this.web3.eth.getTransactionReceipt(txHash);
            if (tx && tx?.status) {
                await this.walletService.updateStatusWalletTransaction(
                    txHash,
                    EStatusTransaction.SUCCESS,
                    EAction.APPROVE_NFT,
                );
                break;
            }
            await Bluebird.delay(1000);
        }

        // admin call the function to create exchange
        const adminPrivateKey = this.roundRobinService.getAdminPrivateKey().value;
        const adminWallet = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);

        const sellerWallet = await this.walletService.getOwnerWallet(sellerId);

        // get transaction data
        const txData = await this.web3Service.createAuction(
            nftId,
            new BigNumber(price).multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString(),
            new BigNumber(price).multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString(),
            this.usdcAddress,
            sellerWallet.fortressWalletAddress,
            this.nftContractAddress,
        );

        // sign transaction
        const signedTx = await adminWallet.signTransaction({
            from: adminWallet.address,
            to: this.nftMarketContractAddress,
            data: txData,
            gas: this.gasLimit,
            gasPrice: await this.web3.eth.getGasPrice(),
        });

        // send transaction
        await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async buy(exchangeId: string, user: IPayloadUserJwt) {
        const { userId } = user;

        const existingExchange = await this.exchangeService.getAvailableExchange(exchangeId, EExchangeType.SELL);

        if (!existingExchange) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.EXCHANGE_NOT_FOUND,
            });
        }

        if (existingExchange.status !== EExchangeStatus.OPEN) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.EXCHANGE_NOT_AVAILABLE,
            });
        }

        // not allow to buy your own token
        if (existingExchange.sellerId === userId) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.NOT_ALLOW_TO_BUY_YOUR_OWN_TOKEN,
            });
        }

        const sellerWallet = await this.walletService.getOwnerWallet(existingExchange.sellerId);

        // create transaction
        const transaction = await this.exchangeService.createOrder({
            exchangeId,
            price: existingExchange.price,
            nftId: existingExchange.nftId,
            nftAddress: existingExchange.nftAddress,
            erc20Address: existingExchange.erc20Address,
            userId,
            status: EOrderStatus.PENDING_TRANSACTION,
            type: EOrderType.BUY,
        });

        // push to queue
        await this.transactionQueue.add(
            {
                data: { order: transaction, sellerAddress: sellerWallet.fortressWalletAddress },
                actions: EExchangeAction.BUY,
            },
            {
                jobId: `${transaction._id}_${EExchangeAction.BUY}`,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 1000 * 60,
                },
                removeOnFail: false,
                removeOnComplete: {
                    age: 60 * 60 * 24,
                },
            },
        );

        this.logger.info('[Buy fixed price exchange]', transaction);
        return formatResponseSuccess({ data: transaction, message: 'Buy fixed price exchange success!' });
    }

    async buyQueueHandler(order: OrderDocument, sellerAddress: string) {
        const { price, nftId, nftAddress, userId } = order;
        const marketplaceFeeRate = +(await this.web3Service.getMarketFeePercentage()) / 100;
        const marketFeeAmount = new BigNumber(price).multipliedBy(marketplaceFeeRate).dividedBy(100);
        const actualBuyAmount = new BigNumber(price).plus(marketFeeAmount);
        // approve marketplace to transfer USDC
        const { txHash } = await this.walletService.approveUsdcForSC(
            userId,
            actualBuyAmount.toString(),
            fortressDefaultNetwork[0].chain,
        );

        // wait for transaction to be mined
        while (true) {
            const tx = await this.web3.eth.getTransactionReceipt(txHash);
            if (tx && tx?.status) {
                await this.walletService.updateStatusWalletTransaction(txHash, EStatusTransaction.SUCCESS, EAction.BUY);
                break;
            }
            await Bluebird.delay(1000);
        }

        // admin call the function to buy token
        const adminPrivateKey = this.roundRobinService.getAdminPrivateKey().value;
        const adminWallet = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);

        const buyerWallet = await this.walletService.getOwnerWallet(userId);

        // get transaction data
        const txData = await this.web3Service.buyNft(
            nftId,
            nftAddress,
            sellerAddress,
            buyerWallet.fortressWalletAddress,
        );

        // sign transaction
        const signedTx = await adminWallet.signTransaction({
            from: adminWallet.address,
            to: this.nftMarketContractAddress,
            data: txData,
            gas: this.gasLimit,
            gasPrice: await this.web3.eth.getGasPrice(),
        });

        // send transaction
        await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async bid(data: BidDto, user: IPayloadUserJwt) {
        const { exchangeId } = data;
        const { userId } = user;
        const existingExchange = await this.exchangeService.getAvailableExchange(exchangeId, EExchangeType.AUCTION);

        const { bidAmount } = data;

        if (!existingExchange) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.EXCHANGE_NOT_FOUND,
            });
        }

        if (existingExchange.auctionStartAt > getUnixTimestamp()) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.AUCTION_HAS_NOT_START,
            });
        }

        if (existingExchange.auctionEndAt < getUnixTimestamp()) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.AUCTION_HAS_ENDED,
            });
        }

        // not allow to bid your own token
        if (existingExchange.sellerId === userId) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.NOT_ALLOW_TO_BID_YOUR_OWN_TOKEN,
            });
        }

        const highestBid = await this.exchangeService.getHighestBid(exchangeId);

        if (highestBid) {
            if (highestBid.userId === userId) {
                throw new exc.BadRequestException({
                    message: ErrorConstant.EXCHANGE.YOU_ALREADY_ARE_HIGHEST_BIDDER,
                });
            }

            // convert the highest bid to big number
            if (bidAmount <= highestBid.price) {
                throw new exc.BadRequestException({
                    message: ErrorConstant.EXCHANGE.BID_AMOUNT_MUST_HIGHER_THAN_HIGHEST_BID,
                });
            }
        }

        if (bidAmount < existingExchange.price) {
            throw new exc.BadRequestException({
                message: ErrorConstant.EXCHANGE.BID_AMOUNT_MUST_HIGHER_THAN_STARTING_PRICE,
            });
        }

        const sellerWallet = await this.walletService.getOwnerWallet(existingExchange.sellerId);

        // create record in order table
        const bitTransaction = {
            exchangeId,
            type: EOrderType.BID,
            userId,
            price: +bidAmount,
            nftId: existingExchange.nftId,
            nftAddress: existingExchange.nftAddress,
            erc20Address: existingExchange.erc20Address,
            status: EOrderStatus.PENDING_TRANSACTION,
        };
        const transaction = await this.exchangeService.createOrder(bitTransaction);

        // push to queue
        await this.transactionQueue.add(
            {
                data: { order: transaction, sellerAddress: sellerWallet.fortressWalletAddress },
                actions: EExchangeAction.BID,
            },
            {
                jobId: `${transaction._id}_${EExchangeAction.BID}`,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 1000 * 60,
                },
                removeOnFail: false,
                removeOnComplete: {
                    age: 60 * 60 * 24,
                },
            },
        );
        this.logger.info('[Bid]', transaction);

        return formatResponseSuccess({ data: transaction, message: 'Bid completed!' });
    }

    async bidQueueHandler(order: OrderDocument, sellerAddress: string) {
        const { price, nftId, nftAddress, userId } = order;
        const marketplaceFeeRate = +(await this.web3Service.getMarketFeePercentage()) / 100;
        const marketFeeAmount = new BigNumber(price).multipliedBy(marketplaceFeeRate).dividedBy(100);
        const actualBidAmount = new BigNumber(price).plus(marketFeeAmount);
        // approve marketplace to transfer USDC
        const { txHash } = await this.walletService.approveUsdcForSC(
            userId,
            actualBidAmount.toString(),
            fortressDefaultNetwork[0].chain,
        );

        // wait for transaction to be mined
        while (true) {
            const tx = await this.web3.eth.getTransactionReceipt(txHash);
            if (tx && tx?.status) {
                await this.walletService.updateStatusWalletTransaction(txHash, EStatusTransaction.SUCCESS, EAction.BID);
                break;
            }
            await Bluebird.delay(1000);
        }

        // admin call the function to bid
        const adminPrivateKey = this.roundRobinService.getAdminPrivateKey().value;
        const adminWallet = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);

        const buyerWallet = await this.walletService.getOwnerWallet(userId);

        // get transaction data
        const txData = await this.web3Service.placeBid(
            nftId,
            new BigNumber(price).multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString(),
            nftAddress,
            sellerAddress,
            buyerWallet.fortressWalletAddress,
        );

        // sign transaction
        const signedTx = await adminWallet.signTransaction({
            from: adminWallet.address,
            to: this.nftMarketContractAddress,
            data: txData,
            gas: this.gasLimit,
            gasPrice: await this.web3.eth.getGasPrice(),
        });

        // send transaction
        await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    async getOneExchange(exchangeId: string, user: IPayloadUserJwt) {
        const exchange = await this.exchangeService.getOneExchange(exchangeId);
        if (exchange && user) {
            const { userId } = user;
            const orderOfUser = await this.exchangeService.getOrdersOfUser(exchangeId, userId);

            if (orderOfUser.length === 0 || exchange.status === EExchangeStatus.PENDING_TRANSACTION) {
                exchange.userStatus = EUserStatusInExchange.NOT_PARTICIPATED;
            } else if (exchange.highestBidInfo) {
                const highestBidderInfo = await this.ownerService.getOwner(exchange.highestBidInfo.userId);
                exchange.highestBidInfo.firstName = highestBidderInfo.firstName;
                exchange.highestBidInfo.lastName = highestBidderInfo.lastName;

                if (exchange.highestBidInfo.status === EOrderStatus.WAITING_SETTLE) {
                    exchange.userStatus =
                        exchange.highestBidInfo.userId === userId
                            ? EUserStatusInExchange.HIGHEST_BIDDER
                            : EUserStatusInExchange.OUT_BID;
                } else if (exchange.highestBidInfo.status === EOrderStatus.WIN) {
                    exchange.userStatus =
                        exchange.highestBidInfo.userId === userId
                            ? EUserStatusInExchange.WINNER
                            : EUserStatusInExchange.LOSER;
                }
            }
        }

        return formatResponseSuccess({ data: exchange, message: 'Get resell exchange!' });
    }

    async getManyExchanges(query: GetExchangesDto, user: IPayloadUserJwt) {
        const exchanges = await this.exchangeService.getManyExchanges(query);

        if (exchanges.data.length !== 0 && user) {
            const { userId } = user;
            const exchangesPromises = exchanges.data.map(async exchange => {
                const orderOfUser = await this.exchangeService.getOrdersOfUser(exchange._id, userId);

                if (orderOfUser.length === 0 || exchange.status === EExchangeStatus.PENDING_TRANSACTION) {
                    exchange.userStatus = EUserStatusInExchange.NOT_PARTICIPATED;
                } else if (exchange.highestBidInfo) {
                    const highestBidderInfo = await this.ownerService.getOwner(exchange.highestBidInfo.userId);
                    exchange.highestBidInfo.firstName = highestBidderInfo.firstName;
                    exchange.highestBidInfo.lastName = highestBidderInfo.lastName;

                    if (exchange.highestBidInfo.status === EOrderStatus.WAITING_SETTLE) {
                        exchange.userStatus =
                            exchange.highestBidInfo.userId === userId
                                ? EUserStatusInExchange.HIGHEST_BIDDER
                                : EUserStatusInExchange.OUT_BID;
                    } else if (exchange.highestBidInfo.status === EOrderStatus.WIN) {
                        exchange.userStatus =
                            exchange.highestBidInfo.userId === userId
                                ? EUserStatusInExchange.WINNER
                                : EUserStatusInExchange.LOSER;
                    }
                }

                return exchange;
            });
            const mappedExchanges = await Promise.all(exchangesPromises);
            exchanges.data = mappedExchanges;
        }
        return exchanges;
    }

    async settleAuction(data: ExchangeDocument): Promise<void> {
        const { _id, nftId, nftAddress, sellerId } = data;

        const adminPrivateKey = this.roundRobinService.getAdminPrivateKey().value;
        const adminWallet = this.web3.eth.accounts.privateKeyToAccount(adminPrivateKey);
        const sellerWallet = await this.walletService.getOwnerWallet(sellerId);

        // get transaction data
        const txData = await this.web3Service.settleAuction(nftId, nftAddress, sellerWallet.fortressWalletAddress);

        // sign transaction
        const signedTx = await adminWallet.signTransaction({
            from: adminWallet.address,
            to: this.nftMarketContractAddress,
            data: txData,
            gas: this.gasLimit,
            gasPrice: await this.web3.eth.getGasPrice(),
        });

        // send transaction
        await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        this.logger.log(`[Check auction results] Auction ${_id} DONE`);
    }

    listMyActiveBids(pagination: BasePaginationDto, filter: Partial<ListMyActiveBidDto>, user: IPayloadUserJwt) {
        return this.exchangeService.listMyActiveBids(pagination, filter, user);
    }

    async handleNftListedEvent(event: IWeb3Event) {
        const { tokenId, nftAddress, seller, price } = event.returnValues;
        const sellerWallet = await this.walletService.getWalletByFortressAddress(seller);

        const exchange = await this.exchangeService.getExchangeByScInfo(
            tokenId,
            nftAddress,
            sellerWallet?.ownerId,
            EExchangeType.SELL,
            EExchangeStatus.PENDING_TRANSACTION,
        );

        await this.exchangeService.updateExchangeStatus(exchange._id, EExchangeStatus.OPEN);

        await this.nftService.updateNftByNftId(tokenId, {
            owner: seller,
            price: Number(new BigNumber(price).div(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString()),
            status: ENftStatus.SELL,
        });

        this.logger.info(`[handleListedNft] NFT ${tokenId} listed successfully!`);
    }

    async handleNftSoldEvent(event: IWeb3Event) {
        const { returnValues, transactionHash } = event;
        const { tokenId, nftAddress, seller, price, buyer } = returnValues;
        const sellerWallet = await this.walletService.getWalletByFortressAddress(seller);
        const buyerWallet = await this.walletService.getWalletByFortressAddress(buyer);

        const exchange = await this.exchangeService.getExchangeByScInfo(
            tokenId,
            nftAddress,
            sellerWallet?.ownerId,
            EExchangeType.SELL,
            EExchangeStatus.OPEN,
        );

        await this.exchangeService.updateExchangeStatus(exchange._id, EExchangeStatus.ENDED);

        await this.exchangeService.updateOrderStatus(
            exchange._id,
            buyerWallet?.ownerId,
            EOrderType.BUY,
            EOrderStatus.PENDING_TRANSACTION,
            EOrderStatus.WIN,
        );

        await this.nftService.updateNftByNftId(tokenId, {
            owner: buyer,
            ownerId: buyerWallet?.ownerId,
            price: Number(new BigNumber(price).div(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString()),
            status: ENftStatus.OWNER,
            datePurchased: event.blockTime,
        });

        await this.walletService.createWalletTransaction({
            walletId: sellerWallet?._id,
            sourceType: ESourceType.EXCHANGE_CONTRACT,
            nftId: tokenId,
            action: EAction.SELL_FIXED,
            amount: new BigNumber(price).div(new BigNumber(10).pow(new BigNumber(this.usdcDecimals))).toString(),
            txHash: transactionHash,
            status: EStatusTransaction.SUCCESS,
        });
        this.logger.info(`[handleSoldNft] NFT ${tokenId} sold successfully!`);
    }

    async handleCreateNftAuctionEvent(event: IWeb3Event) {
        const { returnValues } = event;
        const { tokenId, nftAddress, auctioner } = returnValues;
        const ownerWallet = await this.walletService.getWalletByFortressAddress(auctioner);
        const exchange = await this.exchangeService.getExchangeByScInfo(
            tokenId,
            nftAddress,
            ownerWallet?.ownerId,
            EExchangeType.AUCTION,
            EExchangeStatus.PENDING_TRANSACTION,
        );

        await this.exchangeService.updateExchangeStatus(exchange._id, EExchangeStatus.OPEN);

        await this.nftService.updateNftByNftId(tokenId, {
            owner: auctioner,
            status: ENftStatus.AUCTION,
        });
        this.logger.info(`[handleCreateAuctionNft] NFT ${tokenId} list for auction successfully!`);
    }

    async handlePlaceBidEvent(event: IWeb3Event) {
        const { returnValues } = event;
        const { tokenId, tokenContract, auctioner, bidder } = returnValues;
        const sellerWallet = await this.walletService.getWalletByFortressAddress(auctioner);

        const exchange = await this.exchangeService.getExchangeByScInfo(
            tokenId,
            tokenContract,
            sellerWallet?.ownerId,
            EExchangeType.AUCTION,
            EExchangeStatus.OPEN,
        );

        const bidderWallet = await this.walletService.getWalletByFortressAddress(bidder);

        await this.exchangeService.updateOrderStatus(
            exchange._id,
            bidderWallet?.ownerId,
            EOrderType.BID,
            EOrderStatus.PENDING_TRANSACTION,
            EOrderStatus.WAITING_SETTLE,
        );

        const orderOfExchange = await this.exchangeService.getOrderOfExchange(exchange._id);
        // get the second highest bid
        const secondHighestBid = orderOfExchange
            .filter(order => order.type === EOrderType.BID)
            .sort((a, b) => b.price - a.price)[1];

        if (secondHighestBid) {
            const secondHighestBidderWallet = await this.walletService.getOwnerWallet(secondHighestBid.userId);
            const walletTxRefundBid = await this.walletService.createWalletTransaction({
                walletId: secondHighestBidderWallet._id,
                sourceType: ESourceType.EXCHANGE_CONTRACT,
                nftId: tokenId,
                action: EAction.REFUND_BID,
                amount: secondHighestBid.price.toString(),
                txHash: event.transactionHash,
                status: EStatusTransaction.SUCCESS,
            });
            this.logger.info(`[handlePlaceBid] Refund bid ${walletTxRefundBid} successfully!`);
        }

        this.logger.info(`[handlePlaceBidEvent] NFT ${tokenId} have a new bid!`);
    }

    async handleSettleAuctionEvent(event: IWeb3Event) {
        const { returnValues } = event;
        const { tokenId, tokenContract, auctioner } = returnValues;
        const sellerWallet = await this.walletService.getWalletByFortressAddress(auctioner);
        const exchange = await this.exchangeService.getExchangeByScInfo(
            tokenId,
            tokenContract,
            sellerWallet?.ownerId,
            EExchangeType.AUCTION,
            EExchangeStatus.HANDLING_AUCTION,
        );

        // get all bids of this auction
        const bids = await this.exchangeService.getOrderOfExchange(exchange._id);

        // no bids, auction DONE
        if (bids.length === 0) {
            await this.exchangeService.updateExchangeStatus(exchange._id, EExchangeStatus.ENDED);
            this.logger.log(`Auction ${exchange._id} DONE`);
            return;
        }

        // get only the highest of each bidder
        const highestBidsOfEachBidder = [
            ...new Set(
                bids.map(bid => {
                    return bids
                        .filter(b => b.userId === bid.userId)
                        .reduce((prev, current) => {
                            return prev.price > current.price ? prev : current;
                        });
                }),
            ),
        ];

        // get highest bidder
        const highestBid = highestBidsOfEachBidder.reduce((prev, current) => {
            return prev.price > current.price ? prev : current;
        });

        // update bid status
        await Promise.all(
            bids.map(async bid => {
                if (bid.price !== highestBid.price) {
                    await this.exchangeService.updateOrderStatus(
                        exchange._id,
                        bid.userId,
                        EOrderType.BID,
                        EOrderStatus.WAITING_SETTLE,
                        EOrderStatus.LOSE,
                    );
                } else {
                    await this.exchangeService.updateOrderStatus(
                        exchange._id,
                        bid.userId,
                        EOrderType.BID,
                        EOrderStatus.WAITING_SETTLE,
                        EOrderStatus.WIN,
                    );
                }
            }),
        );

        // update auction status
        await this.exchangeService.updateExchangeStatus(exchange._id, EExchangeStatus.ENDED);

        await this.walletService.createWalletTransaction({
            walletId: sellerWallet?._id,
            sourceType: ESourceType.EXCHANGE_CONTRACT,
            nftId: tokenId,
            action: EAction.SELL_AUCTION,
            amount: highestBid.price.toString(),
            txHash: event.transactionHash,
            status: EStatusTransaction.SUCCESS,
        });

        const winnerInfo = await this.walletService.getWalletByFortressAddress(highestBid.userId);
        await this.nftService.updateNftByNftId(tokenId, {
            owner: winnerInfo?.fortressWalletAddress,
            ownerId: highestBid.userId,
            price: highestBid.price,
            status: ENftStatus.OWNER,
            datePurchased: event.blockTime,
        });

        this.logger.info(`[handleSettleAuctionEvent] auction exchange ${exchange._id} ended !`);
    }
}
