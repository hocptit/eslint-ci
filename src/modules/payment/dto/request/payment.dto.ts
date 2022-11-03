import { CircleConfig, Currency } from '@constants/circle.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class MetadataDto {
    @IsEmail()
    @ApiPropertyOptional({
        example: 'phuchauzalo2@gmail.com',
    })
    email: string;

    @ApiPropertyOptional({
        example: '+14155555555',
    })
    @IsString()
    @IsOptional()
    phoneNumber: string;

    // @ApiPropertyOptional({
    //     example: 'DE6FADIF60BB47B379307F851E238617',
    // })
    // @IsString()
    sessionId?: string;

    @IsOptional()
    ipAddress: string;
}

export class BillingDetailDto {
    @ApiPropertyOptional({
        example: 'Satoshi Nakamoto 2',
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        example: 'Boston',
    })
    @IsString()
    city: string;

    @ApiPropertyOptional({
        example: 'US',
    })
    @IsString()
    country: string;

    @ApiPropertyOptional({
        example: '100 Money Street',
    })
    @IsString()
    line1: string;

    @ApiPropertyOptional({
        example: 'Suite 1',
    })
    @IsString()
    line2: string;

    @ApiPropertyOptional({
        example: 'MA',
    })
    @IsString()
    district: string;

    @ApiPropertyOptional({
        example: '01234',
    })
    @IsString()
    postalCode: string;
}

export class SourceDto {
    @ApiPropertyOptional({
        example: '44363b9c-50f8-4033-9b22-00c2889fc278',
    })
    @IsString()
    id: string;

    @ApiPropertyOptional({
        example: 'card',
    })
    @IsOptional()
    @IsString()
    type: string;
}

export class AmountDto {
    @ApiPropertyOptional({
        example: '5',
    })
    @IsString()
    amount: string;

    @ApiPropertyOptional({
        example: 'usd',
    })
    @IsOptional()
    @IsString()
    currency: Currency;
}

export class CreatePaymentDto {
    @IsString()
    @IsOptional()
    idempotencyKey: string;

    @ApiProperty()
    metadata: MetadataDto;

    @ApiProperty()
    amount: AmountDto;

    @ApiProperty()
    source: SourceDto;

    @ApiPropertyOptional({
        example:
            'LS0tLS1CRUdJTiBQR1AgTUVTU0FHRS0tLS0tCgp3Y0JNQTBYV1NGbEZScFZoQVFmL2VKc3FFNWZJZDhORWxWQTRuZUV0OHpZWXlRL3ozT1ovVjZZVjRHdEwKY2UzdnpkdTlBVVJvOGFjcHZMTFBoalBWZjdXenhJZ1JIWVFFYkpMUVZPWWJ3WWRFLy9TYUZzM0o3bjByCllHK0pGZzhKRzNCYWlUd1VsekNvRDU2czkyNVdDU2NHenlQWXZ0VitwU2RFb1ZXempBbkUxWDIrSVVKSgphb3BjQWN6aU1oSTNDc3krQ09DeVpRU3VpZlppRlhwMCtaMHppQW4yRzZkV1E5VHJjbGhZTmQ1dUR3VmgKRHN5UCt3KzNTM04xNWpqQU1OUmVVU3JMTFpLL0J2T3M5UUhUb2ZYamx1K0wxaHlMMW9GSzJKMk5oUkNiCnJqMUFQVHhtbExuTWdtekNTOER3NVV6NnB0OXFUU2JMVXhBbHFFM2tzSXFIN3Vodk1wQVl0SERacXlUcwpWOUkrQWFLbDNkMVJ3eURsV0I4L1JVcDBLNWtLZjlVOFgyemhwOTdoMkZpMEFGejY4L3dOUDNXOXJyUmUKZmNFOGFOZlBHY3h0WVg3RnV5c3Zuazl5cE5RPQo9OVBHagotLS0tLUVORCBQR1AgTUVTU0FHRS0tLS0tCg==',
    })
    @IsOptional()
    @IsString()
    encryptedData: string;

    @IsString()
    @IsOptional()
    keyId: string;

    @IsString()
    @IsOptional()
    verification: string;

    @ApiPropertyOptional({
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isAcceptTermAndCondition: boolean;
}

export class paymentMethodsDto {
    @ApiProperty()
    @IsString()
    type: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    chain: string;
}

export class CreatePaymentIntentDto {
    @IsString()
    @IsOptional()
    idempotencyKey: string;

    @ApiProperty()
    amount: AmountDto;

    @ApiProperty()
    paymentMethods: paymentMethodsDto;

    @ApiProperty()
    @IsString()
    settlementCurrency: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isAcceptTermAndCondition?: boolean;
}

export class CreateCardDto {
    @IsString()
    @IsOptional()
    idempotencyKey: string;

    @ApiPropertyOptional({
        example: CircleConfig.circle.card.keyId,
    })
    @IsString()
    @IsOptional()
    keyId: string;

    @ApiPropertyOptional({
        example:
            'LS0tLS1CRUdJTiBQR1AgTUVTU0FHRS0tLS0tCgp3Y0JNQTBYV1NGbEZScFZoQVFnQXFPMi9iekw5SHFOTTlVZkNzUlRyRlNqMm1WcjZpUmlFSUdwclJMaXYKZ2dicGdPNWRoSXJZa0NVZnJIaEtRZXA3dWY1Y2d6N3ZIZWZKYnd6TUJ3SU5QU2MxemtJd2ZpT1VFSU9rCkRib0hyKyt1dUtXaFRESjRmN0k4d0ZPcWhMaldmQndVZmJ2bXB1QVhZdnBjV2RCU0ttRVNHazZVSFNLVgpOc21HaitRWFQvQWVFQk5GL0NHMTd0OWJlWG1SQWtmK2JiWFYwU3NoTDk5VGxXbU9BK3hnd055b3R1ZEcKbzh5QVRYTldiMlpqUHFlNjhiMzd5U0FmRGZGZFNTZzBEZ1ZuSGhoUnNVd2p4bHBUYys3R1FUa1V4ZW8rCnB3T2lKRnp1MU91M05rK3hyTEhSVXgrZTNVRllrdFZNUXBZMXhpSzNLUHJEY05Vc2wrQkZDOW4xTjVJLwo2TkphQWMvZ1NEOTRpcmgzRHVLZDBob0NHVGNiR1NMb01BT1lnTlM5NDZnYWZOWG9Gd3RKTXF6WlUzVXoKOVdNbExLVTRSNzN6NzU1Qkpnc2JITDRQSy9xS0xZR2tKZDNkUW9pdVYvc0lnTkVOQzcydWV0SzhHL09uCkRKTE4KPWdnQm0KLS0tLS1FTkQgUEdQIE1FU1NBR0UtLS0tLQo=',
    })
    @IsString()
    encryptedData: string;

    @ApiPropertyOptional({
        example: {
            name: 'Satoshi Nakamoto 2',
            city: 'Boston',
            country: 'US',
            line1: '100 Money Street',
            line2: 'Suite 1',
            district: 'MA',
            postalCode: '01234',
        },
    })
    billingDetails: BillingDetailDto;

    @ApiPropertyOptional({
        example: 1,
    })
    @IsNumber()
    expMonth: number;

    @ApiPropertyOptional({
        example: 2023,
    })
    @IsNumber()
    expYear: number;

    @ApiProperty()
    metadata: MetadataDto;
}
