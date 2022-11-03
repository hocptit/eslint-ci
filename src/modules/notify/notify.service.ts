import { Injectable } from '@nestjs/common';
import NotifyRepository from '@models/repositories/Notify.repository';
import { Notify, NotifyDocument } from '@models/entities/Notify.entity';
import { BaseApi } from '@shared/api/base.api';

@Injectable()
export class NotifyService extends BaseApi<Notify, NotifyDocument> {
    constructor(public notifyRepository: NotifyRepository) {
        super(notifyRepository);
    }
}
