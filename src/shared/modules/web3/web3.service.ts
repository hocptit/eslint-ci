import { EEnvKey } from '@constants/env.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import NFT_ABI from '@constants/abis/nft.abi.json';
import USDC_ABI from '@constants/abis/usdc.abi.json';
import EXCHANGE_ABI from '@constants/abis/exchange.abi.json';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { TransactionReceipt } from 'web3-core';

@Injectable()
export class Web3Service {
    private readonly web3: Web3;
    private readonly nftContract: Contract;
    private readonly usdcContract: Contract;
    private readonly exchangeContract: Contract;

    constructor(private readonly configService: ConfigService) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.configService.get<string>(EEnvKey.RPC)));
        this.nftContract = new this.web3.eth.Contract(
            NFT_ABI as AbiItem[],
            this.configService.get<string>(EEnvKey.NFT_CONTRACT_ADDRESS),
        );
        this.usdcContract = new this.web3.eth.Contract(
            USDC_ABI as AbiItem[],
            this.configService.get<string>(EEnvKey.USDC_CONTRACT_ADDRESS),
        );
        this.exchangeContract = new this.web3.eth.Contract(
            EXCHANGE_ABI as AbiItem[],
            this.configService.get<string>(EEnvKey.EXCHANGE_CONTRACT_ADDRESS),
        );
    }

    getWeb3(): Web3 {
        return this.web3;
    }

    getExchangeContract(): Contract {
        return this.exchangeContract;
    }

    getNftContract(): Contract {
        return this.nftContract;
    }

    getUsdcContract(): Contract {
        return this.usdcContract;
    }

    approveNft(tokenId: string): Promise<string> {
        return this.nftContract.methods
            .approve(this.configService.get<string>(EEnvKey.EXCHANGE_CONTRACT_ADDRESS), tokenId)
            .encodeABI();
    }

    approveUsdc(amount: string): Promise<string> {
        return this.usdcContract.methods
            .approve(this.configService.get<string>(EEnvKey.EXCHANGE_CONTRACT_ADDRESS), amount)
            .encodeABI();
    }

    transferFromUsdc(to: string, amount: string): Promise<string> {
        return this.usdcContract.methods.transfer(to, amount).encodeABI();
    }

    async sendEtherToAddress(privateKey: string, toAddress: string, amount: string): Promise<TransactionReceipt> {
        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        const tx = {
            from: account.address,
            to: toAddress,
            value: this.web3.utils.toWei(amount, 'ether'),
            gas: this.configService.get(EEnvKey.GAS_LIMIT),
            gasPrice: await this.web3.eth.getGasPrice(),
        };
        const signedTx = await account.signTransaction(tx);
        return this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    }

    getTransactionReceipt(txHash: string): Promise<TransactionReceipt> {
        return this.web3.eth.getTransactionReceipt(txHash);
    }

    sellNft(
        nftId: number,
        price: string,
        erc20Address: string,
        sellerAddress: string,
        nftContractAddress: string,
    ): Promise<string> {
        return this.exchangeContract.methods
            .SellNFT(nftId, price, erc20Address, sellerAddress, nftContractAddress)
            .encodeABI();
    }

    buyNft(nftId: number, nftContractAddress: string, sellerAddress: string, buyerAddress: string): Promise<string> {
        return this.exchangeContract.methods
            .BuyNFT(nftId, nftContractAddress, sellerAddress, buyerAddress, 1)
            .encodeABI();
    }

    createAuction(
        nftId: number,
        basePrice: string,
        salePrice: string,
        erc20Address: string,
        auctionerAddress: string,
        nftContractAddress: string,
    ) {
        return this.exchangeContract.methods
            .createAuction(nftId, basePrice, salePrice, erc20Address, auctionerAddress, nftContractAddress)
            .encodeABI();
    }

    async placeBid(
        nftId: number,
        price: string,
        nftContractAddress: string,
        auctionerAddress: string,
        bidderAddress: string,
    ) {
        return this.exchangeContract.methods
            .placeBid(nftId, price, nftContractAddress, auctionerAddress, bidderAddress)
            .encodeABI();
    }

    settleAuction(nftId: number, nftContractAddress: string, auctionerAddress: string) {
        return this.exchangeContract.methods.settleAuction(nftId, nftContractAddress, auctionerAddress).encodeABI();
    }

    async getMarketFeePercentage() {
        return this.exchangeContract.methods.getMarketFeePercentage().call();
    }
}
