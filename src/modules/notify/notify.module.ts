import { Module } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { NotifyController } from './notify.controller';
import { NotifyUsecase } from '@modules/notify/notify.usecase';
import { MongooseModule } from '@nestjs/mongoose';
import { Notify, NotifySchema } from '@models/entities/Notify.entity';
import NotifyRepository from '@models/repositories/Notify.repository';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Notify.name,
                schema: NotifySchema,
            },
        ]),
    ],
    controllers: [NotifyController],
    providers: [NotifyService, NotifyUsecase, NotifyRepository],
    exports: [NotifyService],
})
export class NotifyModule {}
