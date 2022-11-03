import { Command, Console } from 'nestjs-console';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CreateAddressWalletType } from '@modules/wallet/interface/fortress.interface';
import Promise from 'bluebird';
import WalletRepository from '@models/repositories/Wallet.repository';
import { InjectQueue } from '@nestjs/bull';
import {
    CREATE_CIRCLE_WALLET_QUEUE,
    CREATE_CIRCLE_WALLET_QUEUE_NAME,
    CREATE_FORTRESS_WALLET_QUEUE,
    CREATE_FORTRESS_WALLET_QUEUE_NAME,
} from '@constants/bull.constant';
import { Queue } from 'bull';
import { fortressDefaultNetwork } from '@constants/fortress.constant';
import { OwnerService } from '@modules/owner/owner.service';
import { OwnerDocument } from '@models/entities/Owner.entity';
import { ICircleCreateWalletQueue } from '@modules/wallet/interface';
import { v4 as uuidv4 } from 'uuid';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import Bluebird from 'bluebird';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import { WalletService } from '@modules/wallet/wallet.service';

@Injectable()
@Console()
export class WalletConsole {
    constructor(
        @InjectQueue(CREATE_FORTRESS_WALLET_QUEUE_NAME) private fortressWalletQueue: Queue<CreateAddressWalletType>,
        @InjectQueue(CREATE_CIRCLE_WALLET_QUEUE_NAME) private circleWalletQueue: Queue<ICircleCreateWalletQueue>,
        private loggerService: LoggerService,
        private ownerService: OwnerService,
        private walletService: WalletService,
        private readonly walletRepository: WalletRepository,
        private readonly web3Service: Web3Service,
        private readonly configService: ConfigService,
        private readonly walletTransactionRepository: WalletTransactionRepository,
    ) {}

    private logger = this.loggerService.getLogger('WalletConsole');
    private sleepInMs = Number(this.configService.get(EEnvKey.SLEEP_TIME));

    @Command({
        command: 'migration-wallet',
        description: 'Migration fortress wallet from owners',
    })
    async migrationWallet() {
        while (1) {
            const ownersRes: OwnerDocument[] = await this.ownerService.getOwnerNotHasFortressWallet();

            for (const owner of ownersRes) {
                this.logger.info(`[migrationWallet] Start handle migrate owner: ${owner._id}`);
                if (owner.walletId && owner.walletAddress) {
                    this.logger.info(`[migrationWallet] Case: owner has fortress wallet - owner: ${owner._id}`);
                    const walletExisted = await this.walletRepository.findWalletByOwnerId(owner._id);
                    if (!walletExisted) {
                        const walletCreated = await this.walletRepository.walletDocumentModel.create({
                            ownerId: owner._id,
                            fortressWalletId: owner.walletId,
                            fortressWalletAddress: owner.walletAddress,
                            balance: 0,
                            availableBalance: 0,
                        });
                        this.logger.info(`[migrationWallet] Created Internal Wallet ${walletCreated}`);
                        await this.ownerService.updateOwner(owner._id, {
                            hasInternalWallet: true,
                        });
                    } else {
                        if (walletExisted.fortressWalletId && walletExisted.fortressWalletAddress) {
                            this.logger.info(
                                `[migrationWallet] Case: owner has fortress wallet and has internal wallet - owner: ${owner._id}`,
                            );
                        } else {
                            this.logger.info(
                                `[migrationWallet] Case: owner has fortress wallet and has internal wallet but internal not has fortress wallet - owner: ${owner._id}`,
                            );
                            const updateWalletRes = await this.walletRepository.updateFortressData(
                                owner._id,
                                owner.walletId,
                                owner.walletAddress,
                            );
                            this.logger.info(`[migrationWallet] Update Internal Wallet ${updateWalletRes}`);
                            await this.ownerService.updateOwner(owner._id, {
                                hasInternalWallet: true,
                            });
                        }
                    }
                } else {
                    this.logger.info(`[migrationWallet] Case: owner doesn't has fortress wallet - owner: ${owner._id}`);
                    const walletExisted = await this.walletRepository.findWalletByOwnerId(owner._id);
                    if (walletExisted) {
                        this.logger.info(
                            `[migrationWallet] Case: owner doesn't has fortress wallet and has internal wallet - owner: ${owner._id}`,
                        );
                        if (walletExisted.fortressWalletId && walletExisted.fortressWalletAddress) {
                            this.logger.info(
                                `[migrationWallet] Case: owner doesn't has fortress wallet and has internal wallet and internal has fortress wallet - owner: ${owner._id}`,
                            );
                            await this.ownerService.updateOwner(owner._id, {
                                hasInternalWallet: true,
                                walletId: walletExisted.fortressWalletId,
                                walletAddress: walletExisted.fortressWalletAddress,
                            });
                        } else {
                            this.logger.info(
                                `[migrationWallet] Case: owner doesn't has fortress wallet and has internal wallet and internal doesn't has fortress wallet - owner: ${owner._id}`,
                            );
                            await this.fortressWalletQueue.add(
                                CREATE_FORTRESS_WALLET_QUEUE,
                                {
                                    name: owner._id,
                                    assets: fortressDefaultNetwork,
                                },
                                {
                                    delay: 0,
                                    attempts: 5,
                                    backoff: {
                                        type: 'fixed',
                                        delay: 5000,
                                    },
                                    removeOnComplete: { age: 60 * 60 * 24 },
                                    removeOnFail: false,
                                },
                            );
                        }
                    } else {
                        const walletCreated = await this.walletRepository.walletDocumentModel.create({
                            ownerId: owner._id,
                            balance: 0,
                            availableBalance: 0,
                        });
                        this.logger.info(`[migrationWallet] Created Internal Wallet Without Fortress ${walletCreated}`);
                        // push to bull queue: create fortress wallet
                        await this.fortressWalletQueue.add(
                            CREATE_FORTRESS_WALLET_QUEUE,
                            {
                                name: owner._id,
                                assets: fortressDefaultNetwork,
                            },
                            {
                                delay: 0,
                                attempts: 5,
                                backoff: {
                                    type: 'fixed',
                                    delay: 5000,
                                },
                                removeOnComplete: { age: 60 * 60 * 24 },
                                removeOnFail: false,
                            },
                        );
                    }
                }
            }
            this.logger.info(`[migrationWallet] Handle done ${ownersRes.length}`);
            await Promise.delay(1000 * 60 * 15);
        }
    }

    @Command({
        command: 'migration-circle-wallet',
        description: 'Migration Circle wallet from owners',
    })
    async migrationCircleWallet() {
        while (1) {
            const ownersRes: OwnerDocument[] = await this.ownerService.findOwnerNotHasCircleWallet();
            for (const owner of ownersRes) {
                const wallet = await this.walletRepository.findWalletByOwnerId(owner._id);
                if (!wallet) {
                    await this.walletRepository.walletDocumentModel.create({
                        ownerId: owner._id,
                    });
                }
                // push job to queue
                await this.circleWalletQueue.add(
                    CREATE_CIRCLE_WALLET_QUEUE,
                    {
                        ownerId: wallet.ownerId,
                        idempotencyKey: uuidv4(),
                    },
                    {
                        delay: 0,
                        attempts: 5,
                        backoff: {
                            type: 'fixed',
                            delay: 5000,
                        },
                        removeOnComplete: { age: 60 * 60 * 24 },
                        removeOnFail: false,
                    },
                );
                this.logger.info(`Push done migrate user ${owner._id}`);
            }
            this.logger.info(`[migrationCircleWallet] Push done ${ownersRes.length}`);
            await Promise.delay(1000 * 60 * 15);
        }
    }

    @Command({
        command: 'fund-matic',
        description: 'Funding Matic for address wallet in fortress',
    })
    async jobFundMaticFortressWallet() {
        while (1) {
            const wallets = await this.walletRepository.findAllWallets();
            const privateKey = this.configService.get(EEnvKey.PRIVATE_KEY_FUND_MATIC);
            // get account from private key
            const account = await this.web3Service.getWeb3().eth.accounts.privateKeyToAccount(privateKey);
            const adminBalance = Number(await this.web3Service.getWeb3().eth.getBalance(account.address));
            if (adminBalance < 4_000_000_000_000_000_000) {
                this.logger.info(`[fund-matic] Admin balance is not enough 10 MATIC`);
                await Promise.delay(1000 * 60 * 15);
                continue;
            }
            for (const wallet of wallets) {
                this.logger.info('========================================================');
                const maticBalance = this.web3Service
                    .getWeb3()
                    .utils.fromWei(
                        await this.web3Service.getWeb3().eth.getBalance(wallet.fortressWalletAddress),
                        'ether',
                    );
                this.logger.info(
                    `[jobFundMaticFortressWallet] Balance Matic ${maticBalance} - ${wallet.fortressWalletAddress}`,
                );
                const usdcBalance = Number(await this.walletService.getBalanceUSDCOfOwner(wallet.ownerId));
                const isUserHasUsdc = usdcBalance > 0;
                this.logger.info(`[jobFundMaticFortressWallet] User has USDC ${usdcBalance} - ${isUserHasUsdc}`);
                const nftBalance = await this.walletService.getNftOfOwner(wallet.ownerId);
                const isUserHasNft = nftBalance.length > 0;
                this.logger.info(`[jobFundMaticFortressWallet] User has NFT ${nftBalance} - ${isUserHasNft}`);

                const isFundable = isUserHasNft || isUserHasUsdc;
                const isNotEnoughMatic = Number(maticBalance) < Number(this.configService.get(EEnvKey.MATIC_LIMIT));
                this.logger.info(
                    `[jobFundMaticFortressWallet] maticBalance ${maticBalance} - EEnvKey.MATIC_LIMIT ${Number(
                        this.configService.get(EEnvKey.MATIC_LIMIT),
                    )}`,
                );
                this.logger.info(`[jobFundMaticFortressWallet] Is fundable ${isFundable} - ${isNotEnoughMatic}`);
                if (isNotEnoughMatic && isFundable) {
                    this.logger.info(`[jobFundMaticFortressWallet] Start fund Matic ${wallet}`);
                    const tx = await this.web3Service.sendEtherToAddress(
                        privateKey,
                        wallet.fortressWalletAddress,
                        this.configService.get(EEnvKey.MATIC_LIMIT),
                    );
                    this.logger.info(`[jobFundMaticFortressWallet] Tx ${tx}`);
                    this.logger.info(
                        `[jobFundMaticFortressWallet] Funded ${this.configService.get(EEnvKey.MATIC_LIMIT)} to ${
                            wallet.ownerId
                        }`,
                    );
                } else {
                    this.logger.info(`[fundMatic] Wallet ${wallet.ownerId} has enough matic`);
                }
                this.logger.info('========================================================');
            }

            await Bluebird.delay(this.sleepInMs);
        }
    }
}
