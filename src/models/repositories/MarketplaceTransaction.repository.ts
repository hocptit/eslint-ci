import { ListTransactionDto } from '@modules/payment/dto/request/list-transaction.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { MarketplaceTransaction, MarketplaceTransactionDocument } from '../entities/MarketplaceTransaction.entity';
import { formatMongoosePagination, IPaginationMetadata } from '@shared/utils/format';
import { getPaginationOptions } from '@shared/dto/Pagination.dto';
import mongoose from 'mongoose';

@Injectable()
export default class MarketplaceTransactionRepository {
    constructor(
        @InjectModel(MarketplaceTransaction.name)
        public marketplaceTransactionDocumentModel: mongoose.PaginateModel<
            MarketplaceTransactionDocument,
            mongoose.PaginateModel<MarketplaceTransactionDocument>
        >,
    ) {}
    findById(id: string): Promise<MarketplaceTransactionDocument> {
        const objectId = new mongoose.Types.ObjectId(id);
        return this.marketplaceTransactionDocumentModel.findOne({ _id: objectId }).exec();
    }

    findByAlias(alias: string): Promise<MarketplaceTransactionDocument> {
        return this.marketplaceTransactionDocumentModel.findOne({ alias: alias }).exec();
    }

    async listMarketplaceTransaction(
        owner,
        data: ListTransactionDto,
    ): Promise<{
        data: MarketplaceTransaction[];
        _metadata: IPaginationMetadata;
    }> {
        const paginationOptions = getPaginationOptions(data, {
            sortBy: 'updatedAt',
            direction: 'desc',
        });
        const response: mongoose.PaginateResult<MarketplaceTransactionDocument> =
            await this.marketplaceTransactionDocumentModel.paginate({ owner }, paginationOptions);
        return formatMongoosePagination(response);
    }
}
