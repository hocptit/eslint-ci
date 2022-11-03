import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { Nft, NftDocument } from '@models/entities/Nft.entity';
import { BaseRepository } from '@shared/api/models/base.repository';

@Injectable()
export default class NftRepository extends BaseRepository<Nft, NftDocument> {
    constructor(
        @InjectModel(Nft.name)
        public nftDocumentModel: mongoose.PaginateModel<NftDocument, mongoose.PaginateModel<NftDocument>>,
    ) {
        super(nftDocumentModel);
    }

    getNftByNftId(nftId: number): Promise<NftDocument> {
        return this.nftDocumentModel.findOne({ nftId }).exec();
    }

    createNft(nft: Partial<NftDocument>): Promise<NftDocument> {
        return this.nftDocumentModel.create(nft);
    }

    updateNftByNftId(nftId: number, nft: Partial<NftDocument>): Promise<NftDocument> {
        return this.nftDocumentModel.findOneAndUpdate({ nftId }, nft, { new: true }).exec();
    }
}
