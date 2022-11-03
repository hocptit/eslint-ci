import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { encodedId } from './auth.helper';
import { EEnvKey } from '@constants/env.constant';
import { LoggerService } from '@shared/modules/loggers/logger.service';
import UrlCallBackRepository from '@models/repositories/UrlCalback.repository';
import SsoTokenRepository from '@models/repositories/SsoToken.repository';
import { IJWTToken } from './auth.inteface';
import AuthTokenRepository from '@models/repositories/AuthToken.repository';
import { ServiceConstant } from '@constants/service.constant';
import { OwnerDocument } from '@models/entities/Owner.entity';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        private ssoTokenService: SsoTokenRepository,
        private urlCallBackService: UrlCallBackRepository,
        private authToken: AuthTokenRepository,
        private loggerService: LoggerService,
    ) {
        this.loggerService.getLogger(this.configService.get(ServiceConstant.AUTHEN_SERVICE.name));
    }

    getLogin = async (req: Request) => {
        const callbackUrl = `${req.headers.origin}${req.headers.path}`;
        const urlCallback = await this.urlCallBackService.urlCallBackModel.create({
            url: callbackUrl,
            sessionId: encodedId(),
        });
        const redirectUrl = `${this.configService.get(EEnvKey.LOGIN_REDIRECT_URL)}?callback=${urlCallback.sessionId}`;
        return {
            url: redirectUrl,
        };
    };

    getRegister = async (req: Request) => {
        const callbackUrl = `${req.headers.origin}${req.headers.path}`;
        const urlCallback = await this.urlCallBackService.urlCallBackModel.create({
            url: callbackUrl,
            sessionId: encodedId(),
        });
        return {
            url: `${this.configService.get(EEnvKey.REGISTER_REDIRECT_URL)}?callback=${urlCallback.sessionId}`,
        };
    };

    signJWT = async (payload: any): Promise<IJWTToken> => {
        const expireTime = this.configService.get<number>(EEnvKey.TOKEN_EXPIRE_TIME);
        const token = await this.jwtService.signAsync(payload, {
            secret: this.configService.get(EEnvKey.TOKEN_AUTH_KEY),
            expiresIn: expireTime,
        });
        return {
            token,
            ttl: expireTime.toString(),
            userId: payload.userId,
        };
    };

    verifyJWT = async (jwt: string) => {
        try {
            return await this.jwtService.verifyAsync(jwt, {
                secret: this.configService.get(EEnvKey.TOKEN_AUTH_KEY),
            });
        } catch (error) {
            return false;
        }
    };

    generateJWT = async (owner: OwnerDocument): Promise<IJWTToken> => {
        const jwtToken = await this.signJWT({
            userId: owner._id,
            email: owner.email,
            userType: 'owner',
            isMailVerified: owner.isMailVerified,
            kid: owner.email,
        });
        await this.authToken.authTokenModel.create({
            owner: owner._id,
            token: jwtToken.token,
            ttl: jwtToken.ttl,
        });
        return jwtToken;
    };
}
