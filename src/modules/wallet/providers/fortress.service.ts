import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { ConfigService } from '@nestjs/config';
import {
    CreateAddressWalletType,
    ICreateFortressWalletResponse,
    IFortressAuthResponse,
    IFortressEstimateGasResponse,
    IFortressNftBalancesInWalletResponse,
    IFortressSendRawTxInput,
    IFortressSendRawTxResponse,
    IFortressSignTransactionInput,
    IFortressSignTransactionResponse,
    IFortressTransferNft,
    IFortressTransferNftResponse,
    IGetFortressWalletResponse,
} from '@modules/wallet/interface/fortress.interface';
import { EEnvKey } from '@constants/env.constant';
import { fortressApi, FortressChain } from '@constants/fortress.constant';
import { TransferNft } from '@modules/nft/dto/transfer-nft.dto';
import { IFortressGetCryptoBalanceResponse } from '@modules/wallet/interface';
import { HttpServiceBase } from '@shared/modules/http-module/http.service';

@Injectable()
export class FortressService {
    constructor(
        private readonly httpService: HttpServiceBase,
        private logService: LoggerService,
        private readonly configService: ConfigService,
    ) {
        this.logger = this.logService.getLogger('FortressService');
    }
    private logger = this.logService.getLogger('FortressService');

    async getAuthFortressRes(): Promise<string> {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_AUTH_API_URL),
        });
        const [error, response] = await this.httpService.post<IFortressAuthResponse>(`${fortressApi.auth}`, {
            grant_type: 'password',
            username: this.configService.get(EEnvKey.FORTRESS_USERNAME),
            password: this.configService.get(EEnvKey.FORTRESS_PASSWORD),
            audience: this.configService.get(EEnvKey.FORTRESS_AUDIENCE),
            client_id: this.configService.get(EEnvKey.FORTRESS_CLIENT_ID),
        });
        if (error) throw new Error(error.message);
        return response.access_token;
    }

    async createFortressWallet(walletData: CreateAddressWalletType): Promise<IGetFortressWalletResponse> {
        const accessToken = await this.getAuthFortressRes();
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, resCreateWallet] = await this.httpService.post<ICreateFortressWalletResponse>(
            `${fortressApi.wallet}`,
            walletData,
        );
        if (error) throw new Error(error.message);
        return this.getFortressWalletById(resCreateWallet.id);
    }

    async estimateNftTransferFee(transferNftData: TransferNft): Promise<IFortressEstimateGasResponse> {
        const accessToken = await this.getAuthFortressRes();
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.post<IFortressEstimateGasResponse, IFortressTransferNft>(
            `${fortressApi.estimateGas.replace('{walletId}', transferNftData.walletId)}`,
            transferNftData,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async getFortressWalletById(fortressWalletId: string) {
        const accessToken = await this.getAuthFortressRes();
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.get<IGetFortressWalletResponse>(
            `${fortressApi.getWallet.replace('{walletId}', fortressWalletId)}`,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async getBalanceNfts(walletId: string, accessToken: string): Promise<IFortressNftBalancesInWalletResponse[]> {
        // get nft balances in wallet
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.get<IFortressNftBalancesInWalletResponse[]>(
            `${fortressApi.nftBalance.replace('{walletId}', walletId)}`,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async getCryptoBalance(walletId: string, accessToken: string) {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.get<IFortressGetCryptoBalanceResponse>(
            `${fortressApi.cryptoBalance.replace('{walletId}', walletId)}`,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async getNFtIdByTokenId(nftUuid: string, accessToken: string): Promise<string> {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.get(`${fortressApi.getTokenById.replace('{tokenId}', nftUuid)}`);
        if (error) throw new Error(error.message);
        return res.blockchainTokenId;
    }

    async transferNft(job: TransferNft, accessToken: string): Promise<IFortressTransferNftResponse> {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.post<IFortressTransferNftResponse, IFortressTransferNft>(
            `${fortressApi.withdraw.replace('{walletId}', job.walletId)}`,
            job,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async signTransaction(
        walletId: string,
        accessToken: string,
        transactionData: IFortressSignTransactionInput,
        network: FortressChain,
    ): Promise<IFortressSignTransactionResponse> {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.post<
            IFortressSignTransactionResponse,
            IFortressSignTransactionInput
        >(`${fortressApi.signTheTransaction.replace('{walletId}', walletId)}?network=${network}`, transactionData);
        if (error) throw new Error(error.message);
        return res;
    }

    async sendRawTransaction(
        walletId: string,
        accessToken: string,
        signedTxData: IFortressSendRawTxInput,
        network: FortressChain,
    ): Promise<IFortressSendRawTxResponse> {
        this.httpService.setAxiosRequestConfig({
            baseURL: this.configService.get<string>(EEnvKey.FORTRESS_API_URL),
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const [error, res] = await this.httpService.post<IFortressSendRawTxResponse, IFortressSendRawTxInput>(
            `${fortressApi.sendRawTransaction.replace('{walletId}', walletId)}?network=${network}`,
            signedTxData,
        );
        if (error) throw new Error(error.message);
        return res;
    }

    async signAndSendTransaction(
        walletId: string,
        accessToken: string,
        transactionData: IFortressSignTransactionInput,
        network: FortressChain,
    ): Promise<string> {
        const signedMessageData = await this.signTransaction(walletId, accessToken, transactionData, network);
        return (
            await this.sendRawTransaction(
                walletId,
                accessToken,
                {
                    signedTransactionData: signedMessageData.signedMessage,
                },
                network,
            )
        ).transactionHash;
    }
}
