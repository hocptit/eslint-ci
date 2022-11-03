import { forwardRef, Inject, Injectable } from '@nestjs/common';
import WalletRepository from '@models/repositories/Wallet.repository';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import { WalletDocument } from '@models/entities/Wallet.entity';
import { CreateWalletDto } from '@modules/wallet/dto/create-wallet.dto';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ErrorConstant } from '@constants/error.constant';
import { InjectQueue } from '@nestjs/bull';
import {
    CREATE_CIRCLE_WALLET_QUEUE,
    CREATE_CIRCLE_WALLET_QUEUE_NAME,
    CREATE_FORTRESS_WALLET_QUEUE,
    CREATE_FORTRESS_WALLET_QUEUE_NAME,
} from '@constants/bull.constant';
import { Queue } from 'bull';
import {
    CreateAddressWalletType,
    IFortressNftBalancesInWalletResponse,
    IFortressSignTransactionInput,
} from '@modules/wallet/interface/fortress.interface';
import { FortressChain, fortressDefaultNetwork } from '@constants/fortress.constant';
import { BadRequestException, NotFound } from '@shared/exception';
import { v4 as uuidv4 } from 'uuid';
import { ICircleCreateWalletQueue } from '@modules/wallet/interface';
import {
    EAction,
    ESourceType,
    EStatusTransaction,
    WalletTransaction,
    WalletTransactionDocument,
} from '@models/entities/WalletTransaction.entity';
import { EEnvKey } from '@constants/env.constant';
import { Web3Service } from '@shared/modules/web3/web3.service';
import { FortressService } from '@modules/wallet/providers/fortress.service';
import { ConfigService } from '@nestjs/config';
import { NftService } from '@modules/nft/nft.service';
import { BaseApi } from '@shared/api/base.api';
import BigNumber from 'bignumber.js';

@Injectable()
export class WalletService extends BaseApi<WalletTransaction, WalletTransactionDocument> {
    constructor(
        private readonly walletRepository: WalletRepository,
        private readonly walletTransactionRepository: WalletTransactionRepository,
        private loggerService: LoggerService,
        private web3Service: Web3Service,
        private fortressService: FortressService,
        private configService: ConfigService,
        @Inject(forwardRef(() => NftService))
        private nftService: NftService,
        @InjectQueue(CREATE_FORTRESS_WALLET_QUEUE_NAME) private fortressWalletQueue: Queue<CreateAddressWalletType>,
        @InjectQueue(CREATE_CIRCLE_WALLET_QUEUE_NAME) private circleWalletQueue: Queue<ICircleCreateWalletQueue>,
    ) {
        super(walletTransactionRepository);
    }

    private logger = this.loggerService.getLogger('WalletService');
    private usdcDecimals = this.configService.get<string>(EEnvKey.USDC_DECIMAL);

    async createOwnerWallet(walletData: CreateWalletDto): Promise<WalletDocument> {
        const wallet = await this.walletRepository.walletDocumentModel.create(walletData);
        this.logger.info(`[createOwnerWallet] owner: ${wallet.ownerId}`);
        // push to bull queue: create fortress wallet and circle wallet
        await this.fortressWalletQueue.add(
            CREATE_FORTRESS_WALLET_QUEUE,
            {
                name: wallet.ownerId,
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

        return wallet;
    }

    async getOwnerWallet(ownerId: string): Promise<WalletDocument> {
        const wallet = await this.walletRepository.findWalletByOwnerId(ownerId);
        if (!wallet) {
            this.logger.error('[getOwnerBalance] not found wallet');
            throw new NotFound({ message: ErrorConstant.WALLET.NOT_FOUND });
        }
        return wallet;
    }

    getWalletByFortressAddress(fortressAddress: string): Promise<WalletDocument> {
        return this.walletRepository.getWalletByFortressAddress(fortressAddress);
    }

    getWalletTransactionByTxHash(txHash: string): Promise<WalletTransactionDocument> {
        return this.walletTransactionRepository.getWalletTransactionByTxHash(txHash);
    }

    updateStatusWalletTransaction(
        txHash: string,
        status: EStatusTransaction,
        action: EAction,
    ): Promise<WalletTransactionDocument> {
        return this.walletTransactionRepository.updateTransactionStatus(txHash, status, action);
    }

    getWalletTransactionPending(): Promise<WalletTransactionDocument[]> {
        return this.walletTransactionRepository.getWalletTransactionPending();
    }

    async getBalanceUSDCOfOwner(ownerId: string): Promise<string> {
        const ownerWallet = await this.getOwnerWallet(ownerId);
        return new BigNumber(
            this.web3Service.getUsdcContract().methods.balanceOf(ownerWallet.fortressWalletAddress).call(),
        )
            .div(new BigNumber(10).pow(this.usdcDecimals))
            .toString();
    }

    async getNftOfOwner(ownerId: string): Promise<IFortressNftBalancesInWalletResponse[]> {
        const ownerWallet = await this.getOwnerWallet(ownerId);
        const accessToken = await this.fortressService.getAuthFortressRes();

        return this.fortressService.getBalanceNfts(ownerWallet.fortressWalletId, accessToken);
    }

    /**
     * transfer usdc from owner wallet in fortress
     * @returns {Promise<WalletTransactionDocument>} wallet transaction
     * */
    async transferUsdcToAddress(
        ownerId: string,
        toAddress: string,
        amount: string,
        network: FortressChain,
    ): Promise<WalletTransactionDocument> {
        this.logger.info(`[transferUsdcToAddress] owner: ${ownerId}, toAddress: ${toAddress}, amount: ${amount}`);
        const ownerWallet = await this.getOwnerWallet(ownerId);
        const accessToken = await this.fortressService.getAuthFortressRes();

        const balanceUsdc = await this.getBalanceUSDCOfOwner(ownerId);

        // balance and amount in here already div by 10^decimals
        if (Number(balanceUsdc) < Number(amount)) {
            throw new BadRequestException({ message: 'Not enough balance' });
        }
        const amountDecimals = new BigNumber(amount)
            .multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals)))
            .toString();
        const data = await this.web3Service.transferFromUsdc(toAddress, amountDecimals);

        const transactionData: IFortressSignTransactionInput = {
            addressFrom: ownerWallet.fortressWalletAddress,
            addressTo: this.configService.get<string>(EEnvKey.USDC_CONTRACT_ADDRESS),
            data,
            gasPrice: await this.web3Service.getWeb3().eth.getGasPrice(),
            gas: this.configService.get<string>(EEnvKey.GAS_LIMIT),
            value: '0',
        };

        const txHash = await this.fortressService.signAndSendTransaction(
            ownerWallet.fortressWalletId,
            accessToken,
            transactionData,
            network,
        );

        return this.walletTransactionRepository.createWalletTransaction({
            walletId: ownerWallet._id,
            txHash,
            amount,
            action: EAction.TRANSFER_USDC,
            status: EStatusTransaction.PENDING,
            sourceType: ESourceType.FORTRESS,
        });
    }

    // approve usdc from owner wallet in fortress for SC
    async approveUsdcForSC(ownerId: string, amount: string, network: FortressChain) {
        this.logger.info(`[approveUsdcForSC] ${ownerId} ${amount} ${network}`);
        const ownerWallet = await this.getOwnerWallet(ownerId);
        const accessToken = await this.fortressService.getAuthFortressRes();

        const balanceUsdc = await this.getBalanceUSDCOfOwner(ownerId);
        if (Number(balanceUsdc) < Number(amount)) {
            this.logger.error(`[approveUsdcForSC] ${ErrorConstant.WALLET.NOT_ENOUGH_BALANCE}`);
            throw new BadRequestException({ message: ErrorConstant.WALLET.NOT_ENOUGH_BALANCE });
        }

        const amountDecimals = new BigNumber(amount)
            .multipliedBy(new BigNumber(10).pow(new BigNumber(this.usdcDecimals)))
            .toString();
        const data = await this.web3Service.approveUsdc(amountDecimals);

        const transactionData: IFortressSignTransactionInput = {
            addressFrom: ownerWallet.fortressWalletAddress,
            addressTo: this.configService.get<string>(EEnvKey.USDC_CONTRACT_ADDRESS),
            data,
            gasPrice: await this.web3Service.getWeb3().eth.getGasPrice(),
            gas: this.configService.get<string>(EEnvKey.GAS_LIMIT),
            value: '0',
        };
        const txHash = await this.fortressService.signAndSendTransaction(
            ownerWallet.fortressWalletId,
            accessToken,
            transactionData,
            network,
        );

        return this.walletTransactionRepository.createWalletTransaction({
            walletId: ownerWallet._id,
            txHash,
            amount,
            action: EAction.APPROVE_USDC,
            status: EStatusTransaction.PENDING,
            sourceType: ESourceType.FORTRESS,
        });
    }

    // approve Nft from owner wallet in fortress for SC
    async approveNftForSC(ownerId: string, nftId: string, network: FortressChain) {
        this.logger.info(`[approveNftForSC] ${ownerId} ${nftId} ${network}`);
        const ownerWallet = await this.getOwnerWallet(ownerId);
        const ownerAddress = await this.nftService.getOwnerNft(nftId);
        const accessToken = await this.fortressService.getAuthFortressRes();

        if (ownerWallet.fortressWalletAddress !== ownerAddress) {
            throw new BadRequestException({ message: ErrorConstant.WALLET.NOT_ENOUGH_BALANCE });
        }

        const data = await this.web3Service.approveNft(nftId);

        const transactionData: IFortressSignTransactionInput = {
            addressFrom: ownerWallet.fortressWalletAddress,
            addressTo: this.configService.get<string>(EEnvKey.NFT_CONTRACT_ADDRESS),
            data,
            gasPrice: await this.web3Service.getWeb3().eth.getGasPrice(),
            gas: this.configService.get<string>(EEnvKey.GAS_LIMIT),
            value: '0',
        };
        const txHash = await this.fortressService.signAndSendTransaction(
            ownerWallet.fortressWalletId,
            accessToken,
            transactionData,
            network,
        );

        return this.walletTransactionRepository.createWalletTransaction({
            walletId: ownerWallet._id,
            txHash,
            nftId,
            action: EAction.APPROVE_NFT,
            status: EStatusTransaction.PENDING,
            sourceType: ESourceType.FORTRESS,
        });
    }

    async createWalletTransaction(data: Partial<WalletTransactionDocument>) {
        return this.walletTransactionRepository.createWalletTransaction(data);
    }
}
