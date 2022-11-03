import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ExchangeUseCase } from '@modules/exchange/exchange.usecase';
import { CurrentUser, UseAuthGuard, UseSkipGuard } from '@shared/decorators/auth.decorator';
import {
    BidDto,
    CreateAuctionExchangeDto,
    CreateFixedPriceExchangeDto,
    GetExchangesDto,
} from '@modules/exchange/dto/exchange.dto';
import { Exchange } from '@models/entities/Exchange.entity';
import { ApiTags } from '@nestjs/swagger';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { Order } from '@models/entities/Order.entity';
import { ListMyActiveBidDto } from '@modules/exchange/dto/list-my-active-bid.dto';

@UseAuthGuard()
@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
    constructor(private readonly exchangeUseCase: ExchangeUseCase) {}

    @ApiOkResponsePayload(Exchange, EApiOkResponsePayload.OBJECT)
    @Post('/create-listing')
    async createFixedPriceExchange(@Body() data: CreateFixedPriceExchangeDto, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.createFixedPriceExchange(data, user);
    }

    @ApiOkResponsePayload(Exchange, EApiOkResponsePayload.OBJECT)
    @Post('/create-auction')
    async createAuctionExchange(@Body() data: CreateAuctionExchangeDto, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.createAuctionExchange(data, user);
    }

    @ApiOkResponsePayload(Order, EApiOkResponsePayload.OBJECT)
    @Get('/buy/:exchangeId')
    async buyFixedPriceExchange(@Param('exchangeId') exchangeId: string, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.buy(exchangeId, user);
    }

    @ApiOkResponsePayload(Order, EApiOkResponsePayload.OBJECT)
    @Post('/bid')
    async bid(@Body() data: BidDto, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.bid(data, user);
    }

    @ApiOkResponsePayload(Exchange, EApiOkResponsePayload.OBJECT)
    @UseSkipGuard()
    @Get('/get-one/:id')
    async getOneExchange(@Param('id') id: string, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.getOneExchange(id, user);
    }

    @ApiOkResponsePayload(Exchange, EApiOkResponsePayload.ARRAY, true)
    @UseSkipGuard()
    @Get('/get-many')
    async getManyExchanges(@Query() query: GetExchangesDto, @CurrentUser() user: IPayloadUserJwt) {
        return this.exchangeUseCase.getManyExchanges(query, user);
    }

    @ApiOkResponsePayload(Exchange, EApiOkResponsePayload.ARRAY, true)
    @Get('/my-active-bids')
    async myActiveBids(@Query() query: ListMyActiveBidDto, @CurrentUser() user: IPayloadUserJwt) {
        const [pagination, filter] = this.exchangeUseCase.exchangeService.parseFilterDto(query);
        return this.exchangeUseCase.listMyActiveBids(pagination, filter, user);
    }
}
