import { CIRCLE_WEBHOOK_EVENT_QUEUE_NAME } from '@constants/bull.constant';
import { OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { CircleService } from './circle.service';

@Processor(CIRCLE_WEBHOOK_EVENT_QUEUE_NAME)
@Injectable()
export class CircleWebhookProcessor {
    constructor(private circleService: CircleService) {}
    @Process()
    async handleWebhookCircle(job: any) {
        await this.circleService.handleEvent(job.data);
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
