import axios from 'axios';
import { CmcTokenId } from '../../constants/circle.constant';
import { CoinmarketcapConfig } from '@constants/circle.constant';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CoinMarketCapService {
    private axiosInstance;
    constructor(private configService: ConfigService) {
        this.axiosInstance = axios.create({
            baseURL: this.configService.get(EEnvKey.CMC_API_URL),
            headers: {
                'X-CMC_PRO_API_KEY': this.configService.get(EEnvKey.CMC_API_KEY),
            },
        });
    }

    getTokenPriceById = async (id: CmcTokenId) => {
        try {
            const token = await this.axiosInstance.get(
                `${CoinmarketcapConfig.coinmarketcap.api.getTokenPrice}?id=${id}`,
            );
            return token.data.data[`${id}`].quote.USD.price;
        } catch (error) {
            throw new Error('Get price from Coin market cap failed');
        }
    };
}
