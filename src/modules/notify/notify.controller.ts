import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { NotifyUsecase } from '@modules/notify/notify.usecase';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { Notify } from '@models/entities/Notify.entity';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { ListNotifyDto } from '@modules/notify/dto/list-notify.dto';

@ApiTags('notify')
@Controller('notify')
@UseAuthGuard()
export class NotifyController {
    constructor(private readonly notifyUsecase: NotifyUsecase) {}

    @Get('/')
    @ApiOkResponsePayload(Notify, EApiOkResponsePayload.ARRAY, true)
    findAll(@CurrentUser() user: IPayloadUserJwt, @Query() listNotifyDto: ListNotifyDto) {
        return this.notifyUsecase.notifyService.listWithPagination(listNotifyDto, {
            ownerId: user.ownerId,
        });
    }
}
