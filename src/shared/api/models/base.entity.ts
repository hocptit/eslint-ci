import { Document } from 'mongoose';

export type BaseDocument = BaseEntity & Document;

export class BaseEntity {}
