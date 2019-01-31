import {solidityParam, solidityValue, Wallet} from './types/stardust';

import {BigNumber} from 'bignumber.js';
// import Web3 from 'web3';
const Web3 = require('web3');

export const web3: any = new Web3();

interface sigObj {readonly message: string; readonly signature: string;}

export const getSigner = (sig: string | {signedMessage: string}) => {
    const sigIn = typeof sig === 'string' ? sig : sig.signedMessage;
    try {
        return web3.eth.accounts.recover(`0x${sigIn.slice(132)}`, `0x${sigIn.slice(130, 132)}`, `0x${sigIn.slice(2, 66)}`, `0x${sigIn.slice(66, 130)}`);
    } catch(err) {
        return'0x0000000000000000000000000000000000000000';
    }
};

const sigToString = (sig: sigObj) => sig.signature + sig.message.slice(2);

export const toCheckSumAddr = (address: string) => web3.utils.toChecksumAddress(address);

const signRaw = (msg: string, privKey: string): sigObj => web3.eth.accounts.sign(msg, privKey);
export const createRawWallet = (): Wallet => web3.eth.accounts.create();

export const createWallet = () => {
    const{address, privateKey} = web3.eth.accounts.create();
    return[address, privateKey];
};

export const sign = (msg: string, privKey: string) => sigToString(signRaw(msg, privKey));
export const hashParam  = (value: solidityValue, type: solidityParam) => web3.utils.soliditySha3(web3.eth.abi.encodeParameter(type, value));

BigNumber.config({EXPONENTIAL_AT: 300});

const BN = (x: number | string) => new BigNumber(x);

const tsExtraShift = BN(2).pow(120);
const unitShift = BN(2).pow(248);

export const packTS = ({timestamp, unitIn}: {timestamp: BigNumber | number; unitIn: BigNumber | number}) => {
    const tsBN = typeof timestamp === 'number' ? BN(timestamp) : timestamp;
    const unitInBN = typeof unitIn === 'number' ? BN(unitIn) : unitIn;
    const ts             = tsBN.shiftedBy(-unitInBN.toNumber()).integerValue(BigNumber.ROUND_DOWN);
    const tsExtraShifted = tsBN.modulo(BN(10).pow(unitIn)).multipliedBy(tsExtraShift);
    const unitShifted    = unitInBN.multipliedBy(unitShift);
    return ts.plus(tsExtraShifted).plus(unitShifted).toString();
};

export const unpackTS = (data: string) => {
    const dataBN  = BN(data);
    const unit    = dataBN.dividedBy(unitShift).integerValue();
    const tsExtra = dataBN.minus(unit.multipliedBy(unitShift)).dividedBy(tsExtraShift).integerValue();
    const ts = dataBN.minus(unit.multipliedBy(unitShift)).minus(tsExtra.multipliedBy(tsExtraShift));
    return {unit, tsExtra, ts};
};

export const scaleUp = (rarityPercs: ReadonlyArray<number>): [string[], number] => {
    const smallestFraction = Math.max(...rarityPercs.map((z) => new BigNumber(z).decimalPlaces()));
    const scaleFactor = new BigNumber(10).pow(smallestFraction);
    const scaledUp = rarityPercs.map((z) => new BigNumber(z).multipliedBy(scaleFactor)).map(String);
    return [scaledUp, smallestFraction];
};

export {stardustAPI} from './api/data-only';
export {createPostJSON} from './postJSON';
