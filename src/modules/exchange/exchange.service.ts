import { Exchange, ExchangeDocument } from '@models/entities/Exchange.entity';
import { EExchangeStatus, EExchangeType, EOrderType } from '@constants/exchange.constant';
import { OrderDocument } from '@models/entities/Order.entity';
import ExchangeRepository from '@models/repositories/Exchange.repository';
import OrderRepository from '@models/repositories/Order.repository';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { IPaginationMetadata } from '@shared/utils/format';
import {
    CreateAuctionExchangeDto,
    CreateFixedPriceExchangeDto,
    GetExchangesDto,
    GetPendingOrOpenExchangeDto,
    UpdateExchangeDto,
} from './dto/exchange.dto';
import { CreateOrderDto } from './dto/order.dto';
import { BaseApi } from '@shared/api/base.api';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { EOrderStatus } from '@constants/exchange.constant';
import { ListMyActiveBidDto } from '@modules/exchange/dto/list-my-active-bid.dto';

@Injectable()
export class ExchangeService extends BaseApi<Exchange, ExchangeDocument> {
    constructor(
        private exchangeRepo: ExchangeRepository,
        private orderRepo: OrderRepository,
        private loggerService: LoggerService,
    ) {
        super(exchangeRepo);
    }

    private logger = this.loggerService.getLogger('exchange');

    async getPendingOrOpenExchange(data: GetPendingOrOpenExchangeDto): Promise<ExchangeDocument> {
        return await this.exchangeRepo.getPendingOrOpenExchange(data);
    }

    async getAvailableExchange(exchangeId: string, type: EExchangeType): Promise<ExchangeDocument> {
        return await this.exchangeRepo.getAvailableExchange(exchangeId, type);
    }

    async createFixedPriceExchange(data: CreateFixedPriceExchangeDto): Promise<ExchangeDocument> {
        return await this.exchangeRepo.createFixedPriceExchange(data);
    }

    async createAuctionExchange(data: CreateAuctionExchangeDto): Promise<ExchangeDocument> {
        return await this.exchangeRepo.createAuctionExchange(data);
    }

    async updateExchange(data: UpdateExchangeDto): Promise<ExchangeDocument> {
        return await this.exchangeRepo.updateExchange(data);
    }

    async getManyExchanges(data: GetExchangesDto): Promise<{
        data: ExchangeDocument[];
        _metadata: IPaginationMetadata;
    }> {
        return await this.exchangeRepo.getManyExchanges(data);
    }

    async getOneExchange(exchangeId: string): Promise<ExchangeDocument> {
        const result = await this.exchangeRepo.getOneExchange(exchangeId);
        return result[0];
    }

    getExchangeByScInfo(
        tokenId: string,
        nftAddress: string,
        sellerId: string,
        type: EExchangeType,
        status: EExchangeStatus,
    ): Promise<ExchangeDocument> {
        return this.exchangeRepo.getExchangeBySCInfo(tokenId, nftAddress, sellerId, type, status);
    }

    async createOrder(data: CreateOrderDto): Promise<OrderDocument> {
        return await this.orderRepo.createOrder(data);
    }

    async getHighestBid(exchangeId: string): Promise<OrderDocument> {
        return await this.orderRepo.getHighestBid(exchangeId);
    }

    async getExpiredExchanges(): Promise<ExchangeDocument[]> {
        return await this.exchangeRepo.getExpiredExchanges();
    }

    async getOrderOfExchange(exchangeId: string): Promise<OrderDocument[]> {
        return await this.orderRepo.getOrderOfExchange(exchangeId);
    }

    async getOrdersOfUser(exchangeId: string, userId: string): Promise<OrderDocument[]> {
        return await this.orderRepo.getOrdersOfUser(exchangeId, userId);
    }

    updateExchangeStatus(exchangeId: string, status: EExchangeStatus): Promise<ExchangeDocument> {
        return this.exchangeRepo.updateExchangeStatus(exchangeId, status);
    }

    async listMyActiveBids(pagination: BasePaginationDto, filter: Partial<ListMyActiveBidDto>, user: IPayloadUserJwt) {
        return this.exchangeRepo.listMyActiveBids(pagination, filter, user);
    }

    async updateOrderStatus(
        exchangeId: string,
        userId: string,
        type: EOrderType,
        previousStatus: EOrderStatus,
        newStatus: EOrderStatus,
    ): Promise<OrderDocument> {
        return this.orderRepo.updateOrderStatus(exchangeId, userId, type, previousStatus, newStatus);
    }
}
