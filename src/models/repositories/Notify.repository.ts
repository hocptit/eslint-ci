import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { Notify, NotifyDocument } from '@models/entities/Notify.entity';
import { BaseRepository } from '@shared/api/models/base.repository';

@Injectable()
export default class NotifyRepository extends BaseRepository<Notify, NotifyDocument> {
    constructor(
        @InjectModel(Notify.name)
        public notifyDocumentModel: mongoose.PaginateModel<Notify, mongoose.PaginateModel<NotifyDocument>>,
    ) {
        super(notifyDocumentModel);
    }
}
