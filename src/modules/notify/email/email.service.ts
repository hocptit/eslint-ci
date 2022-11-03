import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

import { MAIL_QUEUE_NAME, DEMO_QUEUE } from './email.const';
import { IPayLoadJob } from './email.interface';

@Injectable()
export class EmailService {
    constructor(
        @InjectQueue(MAIL_QUEUE_NAME)
        private mailQueue: Queue,
        private mailerService: MailerService,
    ) {}

    sendOneMail(data: ISendMailOptions) {
        return this.mailerService.sendMail(data);
    }

    async sendMailNotifyTempMergeAboutToSucceed(to: string) {
        try {
            const jobData: IPayLoadJob = {
                to,
            };
            await this.mailQueue.add(DEMO_QUEUE, jobData);
            return true;
        } catch (err) {
            return false;
        }
    }
}
