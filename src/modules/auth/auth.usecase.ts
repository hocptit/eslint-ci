import { Request } from 'express';
import { Injectable, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { ErrorConstant } from '@constants/error.constant';
import { OwnerDocument } from '@models/entities/Owner.entity';
import { SsoTokenDocument } from '@models/entities/SsoToken.entity';
import SsoTokenRepository from '@models/repositories/SsoToken.repository';
import UrlCallBackRepository from '@models/repositories/UrlCalback.repository';
import { CheckAuthDto, LoginDto, RegisterDto } from './dto/request';
import { Unauthorized } from '@shared/exception';
import { encodedId } from './auth.helper';
import { OwnerService } from '@modules/owner/owner.service';
import { AuthService } from './auth.service';
import { IPayloadUserJwt } from '@shared/strategy/jwt.strategy';

@Injectable()
export class AuthUsecase {
    constructor(
        private authService: AuthService,
        private ownerService: OwnerService,
        private configService: ConfigService,
        private ssoTokenService: SsoTokenRepository,
        private urlCallBackService: UrlCallBackRepository,
    ) {}

    async verifySsoToken(clientId: string) {
        const tokenSso: SsoTokenDocument = await this.ssoTokenService.ssoTokenModel.findOne({ token: clientId });
        if (!clientId || !tokenSso) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        const owner: OwnerDocument = await this.ownerService.getOwnerByEmail(tokenSso.ownerEmail);

        const jwtToken = await this.authService.generateJWT(owner);

        await this.ssoTokenService.ssoTokenModel.deleteOne({
            _id: tokenSso.id,
        });
        return jwtToken;
    }

    getLogin(request: Request) {
        return this.authService.getLogin(request);
    }

    async login(loginDto: LoginDto, request: Request) {
        const { callback } = request.query as { callback: string };
        const mainOrigin = new URL(this.configService.get(EEnvKey.LOGIN_REDIRECT_URL));
        if (request.headers.origin === mainOrigin.origin && !callback) {
            const newOwner: OwnerDocument = await this.ownerService.verifyOwner(loginDto);
            const jwtToken = await this.authService.generateJWT(newOwner);
            return jwtToken;
        }
        const urlCallback = await this.urlCallBackService.urlCallBackModel.findOne({
            sessionId: callback,
        });
        if (!urlCallback) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        const url = new URL(urlCallback.url);
        await this.ownerService.verifyOwner(loginDto);
        const tokenSso = await this.ssoTokenService.ssoTokenModel.create({
            token: encodedId(),
            redirectUrl: url.origin,
            ownerEmail: loginDto.email,
        });
        await this.urlCallBackService.urlCallBackModel.deleteOne({
            _id: urlCallback.id,
        });
        return { url: `${urlCallback.url}?clientId=${tokenSso.token}` };
    }

    getRegister(request: Request) {
        return this.authService.getRegister(request);
    }

    async register(registerDto: RegisterDto, request: Request) {
        const { callback } = request.query as { callback: string };
        const mainOrigin = new URL(this.configService.get(EEnvKey.LOGIN_REDIRECT_URL));
        if (request.headers.origin === mainOrigin.origin && !callback) {
            const newOwner: OwnerDocument = await this.ownerService.createOwner(registerDto);
            const jwtToken = await this.authService.generateJWT(newOwner);
            return jwtToken;
        }
        const urlCallback = await this.urlCallBackService.urlCallBackModel.findOne({
            sessionId: callback,
        });
        if (!urlCallback) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        const newOwner: OwnerDocument = await this.ownerService.createOwner(registerDto);

        const url = new URL(urlCallback.url);
        const tokenSso = await this.ssoTokenService.ssoTokenModel.create({
            token: encodedId(),
            redirectUrl: url.origin,
            ownerEmail: newOwner.email,
        });
        await this.urlCallBackService.urlCallBackModel.deleteOne({
            _id: urlCallback.id,
        });
        return { url: `${urlCallback.url}?clientId=${tokenSso.token}` };
    }

    async checkAuth(checkAuthDto: CheckAuthDto, user: IPayloadUserJwt, @Req() request: Request) {
        const mainOrigin = new URL(this.configService.get(EEnvKey.LOGIN_REDIRECT_URL));
        if (request.headers.origin !== mainOrigin.origin) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        const urlCallback = await this.urlCallBackService.urlCallBackModel.findOne({
            sessionId: checkAuthDto.callback,
        });
        if (!urlCallback) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        const owner: OwnerDocument = await this.ownerService.getOwnerByEmail(user.email);

        const url = new URL(urlCallback.url);
        const tokenSso = await this.ssoTokenService.ssoTokenModel.create({
            token: encodedId(),
            redirectUrl: url.origin,
            ownerEmail: owner.email,
        });
        await this.urlCallBackService.urlCallBackModel.deleteOne({
            _id: urlCallback.id,
        });
        return { url: `${urlCallback.url}?clientId=${tokenSso.token}` };
    }
}
