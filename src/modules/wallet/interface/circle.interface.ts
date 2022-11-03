import { ICreateWallet } from '@modules/payment/interface';

export interface ICircleCreateWalletQueue extends ICreateWallet {
    ownerId: string;
}
