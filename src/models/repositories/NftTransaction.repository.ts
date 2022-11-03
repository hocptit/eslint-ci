import { NftTransaction, NftTransactionDocument } from '@models/entities/NftTransaction.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export default class NftTransactionRepository {
    constructor(@InjectModel(NftTransaction.name) public nftTransactionDocumentModel: Model<NftTransactionDocument>) {}
    findNftTransactionById(id: string): Promise<NftTransactionDocument> {
        return this.nftTransactionDocumentModel.findOne({ _id: id }).exec();
    }
}
