import { ApiPropertyOptional } from '@nestjs/swagger';

class BeneficiaryDto {
    @ApiPropertyOptional()
    name: string;

    @ApiPropertyOptional()
    address1?: string;

    @ApiPropertyOptional()
    address2?: string;
}

class BeneficiaryBankDto {
    @ApiPropertyOptional()
    name: string;

    @ApiPropertyOptional()
    address: string;

    @ApiPropertyOptional()
    city: string;

    @ApiPropertyOptional()
    postalCode: string;

    @ApiPropertyOptional()
    country: string;

    @ApiPropertyOptional()
    swiftCode: string;

    @ApiPropertyOptional()
    routingNumber: string;

    @ApiPropertyOptional()
    accountNumber: string;

    @ApiPropertyOptional()
    currency: string;
}
class InstructionDto {
    @ApiPropertyOptional({ example: 'CIR2WD7TET' })
    trackingRef: string;
    @ApiPropertyOptional({
        example: {
            name: 'CIRCLE INTERNET FINANCIAL INC',
            address1: '1 MAIN STREET',
            address2: 'SUITE 1',
        },
    })
    beneficiary: BeneficiaryDto;

    @ApiPropertyOptional({ example: true })
    virtualAccountEnabled: boolean;

    @ApiPropertyOptional({
        example: {
            name: 'CRYPTO BANK',
            address: '1 MONEY STREET',
            city: 'NEW YORK',
            postalCode: '1001',
            country: 'US',
            swiftCode: 'CRYPTO99',
            routingNumber: '999999999',
            accountNumber: '234048505869',
            currency: 'USD',
        },
    })
    beneficiaryBank: BeneficiaryBankDto;
}
export class InstructionWireBankDto {
    @ApiPropertyOptional()
    paymentInstruction: InstructionDto;

    @ApiPropertyOptional({ example: 8 })
    amount: string;

    @ApiPropertyOptional({ example: '635e02f85215d1e4a73c26dd' })
    transactionId: string;
}
