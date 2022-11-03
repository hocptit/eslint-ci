import { Body, Controller, Get, Post } from '@nestjs/common';
import { EOwnerDescription } from '@modules/owner/owner.constant';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { UpdateOwnerDto } from '@modules/owner/dto/request/update-owner.dto';
import { OwnerUsecase } from '@modules/owner/owner.usecase';
import { OwnerResponseDto } from '@modules/owner/dto/response/owner-response.dto';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';

@UseAuthGuard()
@ApiTags('Owner')
@Controller('owner')
export class OwnerController {
    constructor(private readonly ownerUsecase: OwnerUsecase, private loggerService: LoggerService) {}
    private logger = this.loggerService.getLogger('OWNER_SERVICE');

    @Get()
    @ApiOperation({ description: EOwnerDescription.GET_OWNER })
    @ApiOkResponsePayload(OwnerResponseDto, EApiOkResponsePayload.OBJECT)
    getOwner(@CurrentUser() user: any) {
        this.logger.info('getOwner_API_input: ', user);
        return this.ownerUsecase.getOwner(user.userId);
    }

    @Post()
    @ApiOperation({ description: EOwnerDescription.EDIT_OWNER })
    @ApiOkResponsePayload(OwnerResponseDto, EApiOkResponsePayload.OBJECT)
    updateOwner(@CurrentUser() user: any, @Body() updateOwnerDto: UpdateOwnerDto) {
        this.logger.info('updateOwner_API_input: ', updateOwnerDto);
        return this.ownerUsecase.updateOwner(user.userId, updateOwnerDto);
    }
}
