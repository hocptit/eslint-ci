import { v4 } from 'uuid';
import Hashids from 'hashids';

const hashids = new Hashids();

export const deHyphenatedUUID = () => v4().replace(/-/gi, '');

export const encodedId = () => hashids.encodeHex(deHyphenatedUUID());
