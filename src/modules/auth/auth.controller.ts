import { Controller, Post, Body, Get, Req, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiOkResponsePayload, EApiOkResponsePayload } from '@shared/swagger';
import { Request } from 'express';
import { AuthUsecase } from './auth.usecase';
import { GetLoginDto, GetRegisterDto, ResponseVerifyDto, ResponseCheckAuthDto } from './dto/response';
import { ResquestCheckAuthDto, LoginDto, RegisterDto, RequestVerifyDto } from './dto/request';
import { CurrentUser, UseAuthGuard } from '@shared/decorators/auth.decorator';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authUsecase: AuthUsecase) {}

    @Get('verify')
    @ApiOkResponsePayload(ResponseVerifyDto, EApiOkResponsePayload.OBJECT)
    verifySsoToken(@Query() queryParam: RequestVerifyDto) {
        return this.authUsecase.verifySsoToken(queryParam.clientId);
    }

    @Get('login')
    @ApiOkResponsePayload(GetLoginDto, EApiOkResponsePayload.OBJECT)
    async getLogin(@Req() request: Request) {
        return await this.authUsecase.getLogin(request);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto, @Req() request: Request) {
        return this.authUsecase.login(loginDto, request);
    }

    @Get('register')
    @ApiOkResponsePayload(GetRegisterDto, EApiOkResponsePayload.OBJECT)
    getRegister(@Req() request: Request) {
        return this.authUsecase.getRegister(request);
    }

    @Post('register')
    register(@Body() registerDto: RegisterDto, @Req() request: Request) {
        return this.authUsecase.register(registerDto, request);
    }

    @UseAuthGuard()
    @ApiOkResponsePayload(ResponseCheckAuthDto, EApiOkResponsePayload.OBJECT)
    @Post('check-auth')
    checkAuth(
        @Body() checkAuthDto: ResquestCheckAuthDto,
        @CurrentUser() user: IPayloadUserJwt,
        @Req() request: Request,
    ) {
        return this.authUsecase.checkAuth(checkAuthDto, user, request);
    }
}
