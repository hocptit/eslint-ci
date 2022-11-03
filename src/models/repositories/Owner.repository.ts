import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Owner, OwnerDocument } from '@models/entities/Owner.entity';
import { ICreateOwner, IUpdateOwner } from '@modules/owner/interface';

@Injectable()
export default class OwnerRepository {
    constructor(@InjectModel(Owner.name) public ownerDocumentModel: Model<OwnerDocument>) {}

    findById(id: string): Promise<OwnerDocument> {
        return this.ownerDocumentModel.findOne({ _id: id }).exec();
    }

    findByAlias(alias: string): Promise<OwnerDocument> {
        return this.ownerDocumentModel.findOne({ alias: alias }).exec();
    }

    findByEmail(email: string): Promise<OwnerDocument> {
        return this.ownerDocumentModel.findOne({ email: email }).exec();
    }

    create(data: ICreateOwner): Promise<OwnerDocument> {
        return this.ownerDocumentModel.create(data);
    }

    update(id: string, data: IUpdateOwner): void | object {
        return this.ownerDocumentModel.findOneAndUpdate({ _id: id }, data);
    }

    findOwnerNotHasFortressWallet(): Promise<OwnerDocument[]> {
        return this.ownerDocumentModel
            .find({
                hasInternalWallet: { $ne: true },
            })
            .exec();
    }

    findOwnerNotHasCircleWallet(): Promise<OwnerDocument[]> {
        return this.ownerDocumentModel
            .find({
                hasCircleWallet: { $ne: true },
            })
            .exec();
    }

    findAndSelectSomePropertiesById(id: string): Promise<OwnerDocument> {
        return this.ownerDocumentModel
            .findOne({ _id: id })
            .select('_id')
            .select('email')
            .select('firstName')
            .select('lastName')
            .exec();
    }
}
