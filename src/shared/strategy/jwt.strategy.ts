import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EEnvKey } from '@constants/env.constant';
import { OwnerService } from '@modules/owner/owner.service';
import { Unauthorized } from '@shared/exception';
import { ErrorConstant } from '@constants/error.constant';
import { EAuthGuard } from '@constants/auth.constant';

export interface IPayloadUserJwt {
    userId: string;
    ownerId: string;
    email: string;
    userType: string;
}
const configService = new ConfigService();
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, EAuthGuard.JWT) {
    constructor(private ownerService: OwnerService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get(EEnvKey.TOKEN_AUTH_KEY),
        });
    }

    async validate(payload: any): Promise<IPayloadUserJwt> {
        const owner = await this.ownerService.getOwnerByEmail(payload.email);
        if (!owner) {
            throw new Unauthorized({
                message: ErrorConstant.AUTH.UNAUTHORIZED,
            });
        }
        return {
            userId: payload.userId,
            ownerId: payload.userId,
            email: payload.email,
            userType: payload.userType,
        };
    }
}
