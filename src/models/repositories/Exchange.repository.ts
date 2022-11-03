import {
    EExchangeStatus,
    EExchangeType,
    EPaginationSortBy,
    EOrderStatus,
    EUserStatusInExchange,
} from '@constants/exchange.constant';
import {
    CreateAuctionExchangeDto,
    CreateFixedPriceExchangeDto,
    GetExchangesDto,
    GetPendingOrOpenExchangeDto,
    UpdateExchangeDto,
} from '@modules/exchange/dto/exchange.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getPaginationOptions } from '@shared/dto/Pagination.dto';
import { formatMongoosePagination, getUnixTimestamp, IPaginationMetadata } from '@shared/utils/format';
import mongoose, { FilterQuery, PaginateOptions } from 'mongoose';

import { Exchange, ExchangeDocument } from '../entities/Exchange.entity';
import { BaseRepository } from '@shared/api/models/base.repository';
import { BasePaginationDto } from '@shared/api/dto/base-pagination.dto';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { EMyActiveBidsSortBy, ListMyActiveBidDto } from '@modules/exchange/dto/list-my-active-bid.dto';

@Injectable()
export default class ExchangeRepository extends BaseRepository<Exchange, ExchangeDocument> {
    constructor(
        @InjectModel(Exchange.name)
        public exchangeDocumentModel: mongoose.PaginateModel<Exchange, mongoose.PaginateModel<ExchangeDocument>>,
    ) {
        super(exchangeDocumentModel);
    }
    _buildQuery(req: GetExchangesDto) {
        const filters = {} as FilterQuery<Exchange>;
        const { _id, nftId, userId, status, type, fromDate, toDate, endIn } = req;
        if (_id) filters._id = _id;
        if (nftId) filters.nftId = nftId;
        if (userId) filters.userId = userId;
        if (status) filters.status = status;
        if (type) filters.type = type;
        if (fromDate) filters.created_at = { $gte: fromDate };
        if (toDate) filters.created_at = { $lte: toDate };
        if (fromDate && toDate) filters.created_at = { $gte: fromDate, $lte: toDate };
        if (endIn) filters.duration = { $gte: getUnixTimestamp(), $lte: getUnixTimestamp() + endIn };
        return filters;
    }

    getPendingOrOpenExchange(data: GetPendingOrOpenExchangeDto): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel
            .findOne({
                ...data,
                status: { $in: [EExchangeStatus.PENDING_TRANSACTION, EExchangeStatus.OPEN] },
            })
            .exec();
    }

    updateExchange(data: UpdateExchangeDto): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel.findOneAndUpdate({ _id: data.exchangeId }, data, { new: true }).exec();
    }

    getAvailableExchange(exchangeId: string, type: EExchangeType): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel.findOne({ _id: exchangeId, status: EExchangeStatus.OPEN, type }).exec();
    }

    async getOneExchange(exchangeId: string): Promise<any> {
        return this.exchangeDocumentModel
            .aggregate([
                { $set: { _id: { $toString: '$_id' } } },
                { $match: { _id: exchangeId } },
                {
                    $lookup: {
                        from: 'orders',
                        localField: '_id',
                        foreignField: 'exchangeId',
                        pipeline: [{ $sort: { price: -1 } }, { $limit: 1 }, { $project: { _id: 0, exchangeId: 0 } }],
                        as: 'highestBidInfo',
                    },
                },
                { $unwind: { path: '$highestBidInfo', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'nfts',
                        localField: 'nftId',
                        foreignField: 'nftId',
                        as: 'nftInfo',
                    },
                },
                { $unwind: { path: '$nftInfo', preserveNullAndEmptyArrays: true } },
                { $set: { sellerId: { $toObjectId: '$sellerId' } } },
                {
                    $lookup: {
                        from: 'owners',
                        localField: 'sellerId',
                        foreignField: '_id',
                        pipeline: [{ $project: { firstName: 1, lastName: 1, _id: 0 } }],
                        as: 'sellerInfo',
                    },
                },
                { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
            ])
            .exec();
    }

    async getManyExchanges(data: GetExchangesDto): Promise<{
        data: ExchangeDocument[];
        _metadata: IPaginationMetadata;
    }> {
        const paginationOptions = getPaginationOptions(data, {
            sortBy: data.sortBy ?? 'updated_at',
            direction: data.direction ?? 'desc',
        });
        const filters = this._buildQuery(data);
        const aggregate = this.exchangeDocumentModel.aggregate([
            { $set: { _id: { $toString: '$_id' } } },
            { $match: filters },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'exchangeId',
                    pipeline: [{ $sort: { price: -1 } }, { $limit: 1 }, { $project: { _id: 0, exchangeId: 0 } }],
                    as: 'highestBidInfo',
                },
            },
            { $unwind: { path: '$highestBidInfo', preserveNullAndEmptyArrays: true } },
            {
                $sort: {
                    [data.sortBy && data.sortBy === EPaginationSortBy.CURRENT_BID
                        ? 'highestBidInfo.price'
                        : data.sortBy]: data.direction && data.direction === 'desc' ? -1 : 1,
                },
            },
            { $set: { sellerId: { $toObjectId: '$sellerId' } } },
            {
                $lookup: {
                    from: 'owners',
                    localField: 'sellerId',
                    foreignField: '_id',
                    pipeline: [{ $project: { firstName: 1, lastName: 1, _id: 0 } }],
                    as: 'sellerInfo',
                },
            },
            { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nftId',
                    foreignField: 'nftId',
                    as: 'nftInfo',
                },
            },
            { $unwind: { path: '$nftInfo', preserveNullAndEmptyArrays: true } },
        ]);
        // todo: add type for paginate response result
        const response = await (this.exchangeDocumentModel as any).aggregatePaginate(aggregate, paginationOptions);
        return formatMongoosePagination(response);
    }

    createFixedPriceExchange(data: CreateFixedPriceExchangeDto): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel.create(data);
    }

    createAuctionExchange(data: CreateAuctionExchangeDto): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel.create(data);
    }

    getExpiredExchanges(): Promise<ExchangeDocument[]> {
        return this.exchangeDocumentModel
            .find({
                status: EExchangeStatus.OPEN,
                auctionEndAt: { $lte: getUnixTimestamp() },
            })
            .exec();
    }

    getExchangeBySCInfo(
        tokenId: string,
        nftAddress: string,
        sellerId: string,
        type: EExchangeType,
        status: EExchangeStatus,
    ): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel
            .findOne({
                nftId: tokenId,
                nftAddress,
                sellerId,
                type,
                status,
            })
            .exec();
    }

    updateExchangeStatus(exchangeId: string, status: EExchangeStatus): Promise<ExchangeDocument> {
        return this.exchangeDocumentModel.findOneAndUpdate({ _id: exchangeId }, { status }, { new: true }).exec();
    }

    async listMyActiveBids(pagination: BasePaginationDto, filter: Partial<ListMyActiveBidDto>, user: IPayloadUserJwt) {
        console.log(filter, user);
        const paginationOptions: PaginateOptions = {
            sort: {},
            limit: pagination.limit,
            page: pagination.page,
        };
        switch (pagination.sortBy) {
            case EMyActiveBidsSortBy.UPDATE_AT:
                paginationOptions.sort = { updated_at: pagination.direction === 'asc' ? 1 : -1 };
                break;
            case EMyActiveBidsSortBy.BUILD_ORDER:
                paginationOptions.sort = { nftId: pagination.direction === 'asc' ? 1 : -1 };
                break;

            case EMyActiveBidsSortBy.CURRENT_BID:
                paginationOptions.sort = { 'highestBidInfo.price': pagination.direction === 'asc' ? 1 : -1 };
                break;

            case EMyActiveBidsSortBy.REMAIN_TIME:
                paginationOptions.sort = { auctionEndAt: pagination.direction === 'asc' ? 1 : -1 };
                break;
        }

        let filtersStatus = {};
        switch (filter.status) {
            case EOrderStatus.WAITING_SETTLE:
                filtersStatus = {
                    status: EOrderStatus.WAITING_SETTLE,
                };
                break;
            case EOrderStatus.WIN:
                filtersStatus = {
                    status: EOrderStatus.WIN,
                };
                break;
            case EOrderStatus.LOSE:
                filtersStatus = {
                    status: EOrderStatus.LOSE,
                };
                break;
            default:
                filtersStatus = {
                    status: {
                        $in: [EOrderStatus.WAITING_SETTLE, EOrderStatus.WIN, EOrderStatus.LOSE],
                    },
                };
        }

        const aggregate = this.exchangeDocumentModel.aggregate([
            { $set: { _id: { $toString: '$_id' } } },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'exchangeId',
                    pipeline: [
                        {
                            $match: {
                                status: {
                                    $in: [EOrderStatus.WAITING_SETTLE, EOrderStatus.WIN],
                                },
                            },
                        },
                        { $sort: { price: -1 } },
                        { $limit: 1 },
                        { $project: { _id: 0, exchangeId: 0 } },
                    ],
                    as: 'highestBidInfo',
                },
            },
            { $unwind: { path: '$highestBidInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nftId',
                    foreignField: 'nftId',
                    pipeline: [],
                    as: 'nftInfo',
                },
            },
            { $unwind: { path: '$nftInfo', preserveNullAndEmptyArrays: true } },
            { $set: { sellerId: { $toObjectId: '$sellerId' } } },
            {
                $lookup: {
                    from: 'owners',
                    localField: 'sellerId',
                    foreignField: '_id',
                    pipeline: [{ $project: { firstName: 1, lastName: 1, _id: 0 } }],
                    as: 'sellerInfo',
                },
            },
            { $unwind: { path: '$sellerInfo', preserveNullAndEmptyArrays: true } },

            { $set: { _id: { $toString: '$_id' } } },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'exchangeId',
                    pipeline: [
                        {
                            $match: {
                                userId: user.userId,
                                ...filtersStatus,
                            },
                        },
                        { $sort: { price: -1 } },
                        // { $limit: 1 },
                        { $project: { _id: 0, exchangeId: 0 } },
                    ],
                    as: 'myBids',
                },
            },
            {
                $match: { 'myBids.0': { $exists: true } },
            },
        ]);
        // todo; optimize with other code, current duplicate
        const response = await (this.exchangeDocumentModel as any).aggregatePaginate(aggregate, paginationOptions);
        response.docs.map(exchange => {
            if (exchange.status === EExchangeStatus.PENDING_TRANSACTION) {
                exchange.userStatus = EUserStatusInExchange.NOT_PARTICIPATED;
            }

            if (exchange.highestBidInfo?.status === EOrderStatus.WAITING_SETTLE) {
                exchange.userStatus =
                    exchange.highestBidInfo?.userId === user.userId
                        ? EUserStatusInExchange.HIGHEST_BIDDER
                        : EUserStatusInExchange.OUT_BID;
            }

            if (exchange.highestBidInfo?.status === EOrderStatus.WIN) {
                exchange.userStatus =
                    exchange.highestBidInfo?.userId === user.userId
                        ? EUserStatusInExchange.WINNER
                        : EUserStatusInExchange.LOSER;
            }

            return exchange;
        });

        return formatMongoosePagination(response);
    }
}
