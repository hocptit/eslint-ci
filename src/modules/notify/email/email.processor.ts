import { OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';

import { EMAIL_TYPE, MAIL_QUEUE_NAME, DEMO_QUEUE } from './email.const';
import { IPayLoadJob } from './email.interface';
import { EmailService } from './email.service';

@Processor(MAIL_QUEUE_NAME)
@Injectable()
export class MailProcessor {
    constructor(private mailService: EmailService) {}

    @Process(DEMO_QUEUE)
    async sendMailNotifyTempMergeAboutToSuccess(job: Job<IPayLoadJob>) {
        const jobData: IPayLoadJob = job.data;
        await this.mailService.sendOneMail({
            to: jobData.to,
            subject: EMAIL_TYPE.DEMO.SUBJECT,
            template: EMAIL_TYPE.DEMO.TEMPLATE,
            context: {},
        });
    }
    @OnQueueCompleted()
    async handlerOnQueueCompleted(job: Job) {
        await job.remove();
    }

    @OnQueueFailed()
    async handlerOnQueueFailed(job: Job) {
        await job.remove();
    }
}
