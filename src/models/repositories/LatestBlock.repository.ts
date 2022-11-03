import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ELatestBlockKey, LatestBlock, LatestBlockDocument } from '@models/entities/LatestBlock.entity';

@Injectable()
export default class LatestBlockRepository {
    constructor(@InjectModel(LatestBlock.name) public latestBlockDocumentModel: Model<LatestBlockDocument>) {}

    getLatestBlockByKey(key: ELatestBlockKey): Promise<LatestBlockDocument> {
        return this.latestBlockDocumentModel.findOne({ key }).exec();
    }

    updateBlock(_id: string, block: number) {
        return this.latestBlockDocumentModel.updateOne({ _id }, { block }).exec();
    }
}
