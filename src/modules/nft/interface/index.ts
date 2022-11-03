import { EventData } from 'web3-eth-contract';

export interface IQueuePayload {
    fromBlock: number;
    toBlock: number;
}

export interface IWeb3Event extends EventData {
    blockTime: number;
}
