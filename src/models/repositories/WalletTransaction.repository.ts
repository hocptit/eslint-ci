import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import {
    EAction,
    EStatusTransaction,
    WalletTransaction,
    WalletTransactionDocument,
} from '@models/entities/WalletTransaction.entity';
import { BaseRepository } from '@shared/api/models/base.repository';

@Injectable()
export default class WalletTransactionRepository extends BaseRepository<WalletTransaction, WalletTransactionDocument> {
    constructor(
        @InjectModel(WalletTransaction.name)
        public walletTransactionDocumentModel: mongoose.PaginateModel<
            WalletTransactionDocument,
            mongoose.PaginateModel<WalletTransactionDocument>
        >,
    ) {
        super(walletTransactionDocumentModel);
    }
    getWalletTransactionByTxHash(txHash: string): Promise<WalletTransactionDocument> {
        return this.walletTransactionDocumentModel.findOne({ txHash }).exec();
    }

    createWalletTransaction(walletTransaction: Partial<WalletTransactionDocument>): Promise<WalletTransactionDocument> {
        return this.walletTransactionDocumentModel.create(walletTransaction);
    }

    updateWalletTransactionByTxHash(txHash: string, status: EStatusTransaction): Promise<WalletTransactionDocument> {
        return this.walletTransactionDocumentModel.findOneAndUpdate({ txHash }, { status }, { new: true }).exec();
    }

    getWalletTransactionPending(): Promise<WalletTransactionDocument[]> {
        return this.walletTransactionDocumentModel.find({ status: EStatusTransaction.PENDING }).exec();
    }

    updateTransactionStatus(
        txHash: string,
        status: EStatusTransaction,
        action: EAction,
    ): Promise<WalletTransactionDocument> {
        return this.walletTransactionDocumentModel
            .findOneAndUpdate({ txHash }, { status, action }, { new: true })
            .exec();
    }
}
