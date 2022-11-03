import { CreateOrderDto, GetOrdersDto } from '@modules/exchange/dto/order.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { getPaginationOptions } from '@shared/dto/Pagination.dto';
import { formatMongoosePagination } from '@shared/utils/format';
import { FilterQuery, Model } from 'mongoose';

import { Order, OrderDocument } from '../entities/Order.entity';
import { EOrderStatus, EOrderType } from '@constants/exchange.constant';

@Injectable()
export default class OrderRepository {
    constructor(@InjectModel(Order.name) public orderDocumentModel: Model<OrderDocument>) {}
    _buildQuery(req: Partial<GetOrdersDto>) {
        const filters = {} as FilterQuery<Order>;
        const { id, tokenId, ownerId, status, type, exchangeId } = req;
        if (id) filters._id = id;
        if (tokenId) filters.tokenId = tokenId;
        if (ownerId) filters.ownerId = ownerId;
        if (status) filters.status = status;
        if (type) filters.type = type;
        if (exchangeId) filters.exchangeId = exchangeId;
        return filters;
    }

    getOneOrder(data: Partial<GetOrdersDto>): Promise<OrderDocument> {
        const filters = this._buildQuery(data);
        return this.orderDocumentModel.findOne(filters).exec();
    }

    async getOrders(data: GetOrdersDto): Promise<any> {
        const paginationOptions = getPaginationOptions(data, {
            sortBy: data.sortBy ?? 'created_at',
            direction: data.direction ?? 'desc',
        });
        const filters = this._buildQuery(data);
        const response = await (this.orderDocumentModel as any).paginate(filters, paginationOptions);
        return formatMongoosePagination(response);
    }

    createOrder(data: CreateOrderDto): Promise<OrderDocument> {
        return this.orderDocumentModel.create(data);
    }

    getHighestBid(exchangeId: string): Promise<OrderDocument> {
        return this.orderDocumentModel.findOne({ exchangeId }).select(['price', 'userId']).sort({ price: -1 }).exec();
    }

    getOrderOfExchange(exchangeId: string): Promise<OrderDocument[]> {
        return this.orderDocumentModel.find({ exchangeId }).exec();
    }

    getOrdersOfUser(exchangeId: string, userId: string): Promise<OrderDocument[]> {
        return this.orderDocumentModel.find({ exchangeId, userId }).exec();
    }

    updateOrderStatus(
        exchangeId: string,
        userId: string,
        type: EOrderType,
        previousStatus: EOrderStatus,
        newStatus: EOrderStatus,
    ): Promise<OrderDocument> {
        return this.orderDocumentModel
            .findOneAndUpdate(
                {
                    exchangeId,
                    userId,
                    type,
                    status: previousStatus,
                },
                {
                    status: newStatus,
                },
                { new: true },
            )
            .exec();
    }
}
