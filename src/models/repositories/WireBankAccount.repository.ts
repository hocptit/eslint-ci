import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WireBankAccount, WireBankAccountDocument } from '@models/entities/WireBankAccount.entity';

@Injectable()
export default class WireBankAccountRepository {
    constructor(
        @InjectModel(WireBankAccount.name) public wireBankAccountDocumentModel: Model<WireBankAccountDocument>,
    ) {}

    findByOwnerId(id: string): Promise<WireBankAccount> {
        return this.wireBankAccountDocumentModel.findOne({ ownerId: id }).exec();
    }

    createIfNotExist(ownerId, bankAccountId: string) {
        return this.wireBankAccountDocumentModel.create({ ownerId: ownerId, bankAccountIds: [bankAccountId] });
    }

    update(ownerId: string, newListAccountIds: string[]): Promise<WireBankAccount> {
        return this.wireBankAccountDocumentModel
            .findOneAndUpdate({ ownerId: ownerId }, { bankAccountIds: newListAccountIds })
            .exec();
    }
}
