import { Injectable } from '@nestjs/common';
import NotifyRepository from '@models/repositories/Notify.repository';
import { NotifyService } from '@modules/notify/notify.service';

@Injectable()
export class NotifyUsecase {
    constructor(private notifyRepository: NotifyRepository, public notifyService: NotifyService) {}
}
