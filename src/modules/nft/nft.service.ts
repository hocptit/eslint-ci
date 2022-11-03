import { Injectable } from '@nestjs/common';
import { TransferNft } from '@modules/nft/dto/transfer-nft.dto';
import { InjectQueue } from '@nestjs/bull';
import { TRANSFER_NFT_QUEUE, TRANSFER_NFT_QUEUE_NAME } from '@constants/bull.constant';
import { Queue } from 'bull';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { Web3Service } from '@shared/modules/web3/web3.service';
import NftRepository from '@models/repositories/Nft.repository';
import { ENftStatus, Nft, NftDocument, NftMetadata } from '@models/entities/Nft.entity';
import WalletTransactionRepository from '@models/repositories/WalletTransaction.repository';
import { IWeb3Event } from '@modules/nft/interface';
import WalletRepository from '@models/repositories/Wallet.repository';
import { BaseApi } from '@shared/api/base.api';
import { HttpService } from '@nestjs/axios';
import { isDevelopmentEnv } from '@constants/env.constant';

@Injectable()
export class NftService extends BaseApi<Nft, NftDocument> {
    constructor(
        @InjectQueue(TRANSFER_NFT_QUEUE_NAME) private transferNftQueue: Queue<TransferNft>,
        private loggerService: LoggerService,
        private web3Service: Web3Service,
        private nftRepository: NftRepository,
        private walletTransactionRepository: WalletTransactionRepository,
        private walletRepository: WalletRepository,
        private httpService: HttpService,
    ) {
        super(nftRepository);
    }
    private logger = this.loggerService.getLogger('NftService');

    getOwnerNft(nftId: string): Promise<string> {
        const contract = this.web3Service.getNftContract();
        return contract.methods.ownerOf(nftId).call();
    }

    async handleIpfs(ipfs: string): Promise<NftMetadata> {
        try {
            const res = await this.httpService.axiosRef.get<NftMetadata>(
                ipfs.replace('ipfs://', 'https://ipfs.io/ipfs/'),
            );
            return res.data;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    async transferNft(transferNft: TransferNft) {
        await this.transferNftQueue.add(TRANSFER_NFT_QUEUE, transferNft);
        this.logger.info(`[transferNft] Transfer NFT: ${transferNft}`, {
            delay: 0,
            attempts: 5,
            backoff: {
                type: 'fixed',
                delay: 5000,
            },
            removeOnComplete: { age: 60 * 60 * 24 },
            removeOnFail: false,
        });
        return true;
    }

    getUriOfNft(nftId: string): Promise<string> {
        const contract = this.web3Service.getNftContract();
        return contract.methods.tokenURI(nftId).call();
    }

    updateNftByNftId(nftId: number, data: Partial<NftDocument>) {
        return this.nftRepository.updateNftByNftId(nftId, data);
    }

    async handleTransferNft(event: IWeb3Event) {
        let status;
        const { returnValues } = event;
        const { from, to, tokenId } = returnValues;
        const nft = await this.nftRepository.getNftByNftId(tokenId);
        const ownerWallet = await this.walletRepository.findWalletByFortressAddress(to);
        const ownerId = ownerWallet ? ownerWallet.ownerId : nft?.ownerId;
        const isDevelop = isDevelopmentEnv();
        if (!nft) {
            if (from === '0x0000000000000000000000000000000000000000') {
                status = ENftStatus.OWNER;
            }
            const uri = (await this.getUriOfNft(tokenId)) || '';
            await this.nftRepository.createNft({
                nftId: Number(tokenId),
                owner: to,
                uri,
                // todo: uncomment when deploy production
                metadata: uri && !isDevelop ? await this.handleIpfs(uri) : null,
                ownerId,
                status,
                datePurchased: event.blockTime,
            });
        } else {
            nft.owner = to;
            nft.ownerId = ownerId;
            nft.datePurchased = event.blockTime;
            await nft.save();
        }
    }

    getNftByNftId(nftId: number) {
        return this.nftRepository.getNftByNftId(nftId);
    }
}
