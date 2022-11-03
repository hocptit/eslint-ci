import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Wallet, WalletDocument } from '@models/entities/Wallet.entity';
import { BaseRepository } from '@shared/api/models/base.repository';
import mongoose from 'mongoose';

@Injectable()
export default class WalletRepository extends BaseRepository<Wallet, WalletDocument> {
    constructor(
        @InjectModel(Wallet.name)
        public walletDocumentModel: mongoose.PaginateModel<WalletDocument, mongoose.PaginateModel<WalletDocument>>,
    ) {
        super(walletDocumentModel);
    }
    findWalletById(id: string): Promise<WalletDocument> {
        return this.walletDocumentModel.findOne({ _id: id }).exec();
    }

    findWalletByOwnerId(ownerId: string): Promise<WalletDocument> {
        return this.walletDocumentModel.findOne({ ownerId: ownerId }).exec();
    }

    findAllWallets(): Promise<WalletDocument[]> {
        return this.walletDocumentModel.find().exec();
    }

    findWalletByFortress(fortressWalletId: string, fortressWalletAddress: string): Promise<WalletDocument> {
        return this.walletDocumentModel
            .findOne({
                fortressWalletId,
                fortressWalletAddress,
            })
            .exec();
    }

    findWalletByFortressAddress(fortressWalletAddress: string): Promise<WalletDocument> {
        return this.walletDocumentModel
            .findOne({
                fortressWalletAddress,
            })
            .exec();
    }

    updateFortressData(ownerId: string, fortressWalletId: string, fortressWalletAddress: string) {
        return this.walletDocumentModel.findOneAndUpdate(
            {
                ownerId,
            },
            {
                fortressWalletId,
                fortressWalletAddress,
            },
            { new: true },
        );
    }

    async updateCircleData(
        ownerId: string,
        circleWalletId: string,
        circleAddressOnPolygon: string,
    ): Promise<WalletDocument> {
        return this.walletDocumentModel.findOneAndUpdate(
            {
                ownerId,
            },
            {
                circleWalletId,
                circleAddressOnPolygon,
            },
            { new: true },
        );
    }

    getWalletByFortressAddress(fortressWalletAddress: string): Promise<WalletDocument> {
        return this.walletDocumentModel.findOne({ fortressWalletAddress }).exec();
    }
}
