import {AxiosPromise} from 'axios';
import {Request, Response} from 'express';

export type valueof<T> = T[keyof T];

export type rarityType = 1 | 2 | 3 | 4 | 5;

type solidityParamSingle = 'bytes32' | 'uint256' | 'address' | 'string' | 'bytes' | 'bool';
type solidityParamArray = 'bytes32[]' | 'uint256[]' | 'address[]' | 'string[]';
export type solidityParam = solidityParamArray | solidityParamSingle;

export type address = string;
export type base64 = string;
export type hexString = string;
export type signedMessage = hexString;
export type keccak256Hash = hexString;

export type solidityValue = number | string | boolean | ReadonlyArray<number> | ReadonlyArray<string> | ReadonlyArray<boolean>;

export type maybePromise<T> = Promise<T> | T;
export type maybePromisedProps<T> = {[P in keyof T]: maybePromise<T[P]>};

export type ThenArg<T> = T extends Promise<infer U> ? U : T;

export type unMaybePromisedProps<T> = {[P in keyof T]: ThenArg<T[P]>};

export interface map<T> {readonly [key: string]: T;}
export type logLevel = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error';

export interface JOICheck<T = any> {readonly valid: boolean; readonly value: T;}

interface baseData {readonly gameAddr: addr;}

export interface hashCheck {readonly correctHash: boolean; readonly suppliedHash: keccak256Hash;}
export interface sigCheck {readonly correctSigner: boolean; readonly signer: addr; }

export interface Wallet {readonly address: addr; readonly privateKey: hexString;}

export namespace API {
    export type endpoint = (req: Request, res: Response) => void;
    export type endpointAsync = (req: Request, res: Response) => Promise<void>;
    export type endpointNew<T> = (data: T, res: Response) => Promise<void>;
    export interface baseErrorsObj {readonly timestamp?: string; readonly signer?: string; readonly hash?: string;}

    export interface signedData {readonly signedMessage: hexString;}
}

export namespace IPFSMeta {
    export type TokenData = Readonly<{tokenId: number; name: string; desc: string; image: string; rarity: number; cap: number}>
    export interface BoxData {readonly boxId: number; readonly name: string; readonly desc: string; readonly image: string;}
    export interface GameData extends baseData {readonly name: string; readonly symbol: string; readonly desc: string; readonly image: string;}
    export interface GameDataFile {readonly game: GameData; readonly tokens: ReadonlyArray<TokenData>; readonly boxes: ReadonlyArray<BoxData>;}
}

export namespace Token {
    export interface metaData extends baseData {readonly tokenId: number; readonly name: string; readonly desc: string; readonly image: string; readonly rarity: number; readonly cap: number; readonly val: number; readonly owners: ReadonlyArray<address>; readonly totalSupply: number;}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface deployData extends baseData {readonly cap: number; readonly desc: string; readonly image: string; readonly name: string; readonly rarity: rarityType; readonly val: number; readonly timestamp: number;}
    export interface deployDataContract extends baseData {readonly cap: number; readonly rarity: rarityType; readonly val: number; readonly timestamp: number;}
    export interface deployDataSigned extends deployData, API.signedData {}
    export interface deployErrorObj extends API.baseErrorsObj {readonly rarity_cap?: string;}

    export interface mintData extends baseData {readonly tokenId: number; readonly to: addr; readonly amount: number; readonly timestamp: number;}
    export interface mintDataSigned extends mintData, API.signedData {}

    export interface transferData {readonly from: addr; readonly to: addr; readonly amount: number; readonly timestamp: number; readonly tokenId: number; readonly gameAddr: addr;}
    export interface transferDataSigned extends transferData, API.signedData {}
}

export namespace Box {
    export interface metaData extends baseData {readonly boxId: number; readonly isValid: boolean; readonly name: string; readonly desc: string; readonly image: string; readonly tokens: ReadonlyArray<number>;}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface deployData extends baseData {readonly name: string; readonly desc: string; readonly image: string; readonly tokens: number[]; readonly timestamp: number;}
    export interface deployDataContract extends baseData {readonly tokens: number[]; readonly timestamp: number;}
    export interface deployDataSigned extends deployData, API.signedData {}
    export interface deployErrorObj extends API.baseErrorsObj {readonly tokens?: string;}

    export interface removeData extends baseData {readonly boxId: number; readonly timestamp: number;}
    export interface removeDataSigned extends removeData, API.signedData {}

    export interface updateData extends baseData {readonly boxId: number; readonly isValid: boolean; readonly name: string; readonly desc: string; readonly image: string; readonly tokens: number[]; readonly timestamp: number;}
    export interface updateDataContract extends baseData {readonly boxId: number; readonly isValid: boolean; readonly tokens: number[]; readonly timestamp: number;}
    export interface updateDataSigned extends updateData, API.signedData {}

    export interface buyData extends baseData {readonly boxId: number; readonly timestamp: number;}
    export interface buyDataSigned extends buyData, API.signedData {}
}

export namespace Game {
    export interface metaData extends baseData {readonly desc: string; readonly gameOwner: addr; readonly image: string; readonly name: string; readonly rarityNames: ReadonlyArray<string>; readonly rarityPercs: ReadonlyArray<number>; readonly symbol: string; readonly totalSupply: number;}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}
    export interface unpromisedMetaData extends unMaybePromisedProps<maybePromisedProps<metaData>> {}

    export interface deployData {readonly name: string; readonly symbol: string; readonly desc: string; readonly image: string; readonly owner: addr; readonly timestamp: number;}
    export interface deployDataSigned extends deployData, API.signedData {}

    export interface transferData extends baseData {readonly from: addr; readonly to: addr; timestamp: number;}
    export interface transferDataSigned extends transferData, API.signedData {}
}

export namespace Loan {
    export interface metaData extends baseData {readonly loanId: number; readonly isActive: boolean; readonly lender: addr; readonly borrower: addr; readonly tokenId: number; readonly amount: number; readonly start: number; readonly length: number;}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray extends baseData {readonly isActive: ReadonlyArray<boolean>; readonly lender: ReadonlyArray<address>; readonly borrower: ReadonlyArray<address>; readonly tokenId: ReadonlyArray<number>; readonly amount: ReadonlyArray<number>; readonly start: ReadonlyArray<number>; readonly length: ReadonlyArray<number>;}

    export interface offerPrivateData extends baseData {readonly lender: addr; readonly borrower: addr; readonly tokenId: number; readonly amount: number; readonly length: number; timestamp: number;}
    export interface offerPrivateDataSigned extends offerPrivateData, API.signedData {}

    export interface offerPublicData extends baseData {readonly lender: addr; readonly tokenId: number; readonly amount: number; readonly length: number; readonly timestamp: number;}
    export interface offerPublicDataSigned extends offerPublicData, API.signedData {}

    export interface handlePublicData extends baseData {readonly loanId: number; readonly timestamp: number; decision: boolean;}
    export interface handlePublicDataSigned extends handlePublicData, API.signedData {}

    export interface handlePrivateData extends baseData {readonly loanId: number; readonly decision: boolean; readonly timestamp: number;}
    export interface handlePrivateDataSigned extends handlePrivateData, API.signedData {}

    export interface finishData extends baseData {readonly loanId: number; readonly timestamp: number;}
    export interface finishDataSigned extends finishData, API.signedData {}
}

export namespace Shop {
    export interface metaData extends baseData {readonly id: number; readonly tokenId: number; readonly amount: number; readonly created: number; readonly gameAddr: addr; readonly caller: addr;}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray {readonly ids: number[]; readonly tokenIds: number[]; readonly amounts: number[]; readonly createds: number[]; readonly gameAddrs: addr[]; readonly callers: addr[];}

    export interface tokenToCashData extends baseData {readonly tokenId: number; readonly amount: number; readonly timestamp: number;}
    export interface tokenToCashDataSigned extends tokenToCashData, API.signedData {}

    export interface cashToTokenData extends baseData {readonly tokenId: number; readonly amount: number; readonly timestamp: number;}
    export interface cashToTokenDataSigned extends cashToTokenData, API.signedData {}

    export interface tokenToTokenData extends baseData {readonly fromId: number; readonly fromAmount: number; readonly toId: number; readonly toAmount: number; readonly timestamp: number;}
    export interface tokenToTokenDataSigned extends tokenToTokenData, API.signedData {}
}

export namespace Trade {
    export interface metaData extends baseData {readonly taker: addr; readonly trader: addr; readonly offeredId: num; readonly offeredAmount: num; readonly wantedId: num; readonly wantedAmount: num; readonly createdOn: num; readonly state: num;}
    export interface promiedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray extends baseData {readonly takers: addr[]; readonly traders: addr[]; readonly offeredIds: num[]; readonly offeredAmounts: num[]; readonly wantedIds: num[]; readonly wantedAmounts: num[]; readonly createdOns: num[]; readonly states: num[];}

    export interface offerPrivateData extends baseData {readonly taker: addr; readonly offeredId: num; readonly offeredAmount: num; readonly wantedId: num; readonly wantedAmount: num; readonly timestamp: num;}
    export interface offerPrivateDataSigned extends offerPrivateData, API.signedData {}

    export interface offerPublicData extends baseData {readonly offeredId: num; readonly offeredAmount: num; readonly wantedId: num; readonly wantedAmount: num; readonly timestamp: num;}
    export interface offerPublicDataSigned extends offerPublicData, API.signedData {}

    export interface takePrivateData extends baseData {readonly index: num; readonly timestamp: num;}
    export interface takePrivateDataSigned extends takePrivateData, API.signedData {}

    export interface takePublicData extends baseData {readonly index: num; readonly timestamp: num;}
    export interface takePublicDataSigned extends takePublicData, API.signedData {}

    export interface removeTradeData extends baseData {readonly index: num; readonly timestamp: num;}
    export interface removeTradeDataSigned extends removeTradeData, API.signedData {}
}

export namespace Wrapper {
    export interface Setters {
        token: {add: Token.deployData; mint: Token.mintData; transfer: Token.transferData};
        box: {add: Box.deployData; buy: Box.buyData; remove: Box.removeData; update: Box.updateData};
        game: {deploy: Game.deployData; transfer: Game.transferData};
        loan: {finish: Loan.finishData; handlePrivate: Loan.handlePrivateData; handlePublic: Loan.handlePrivateData; offerPrivate: Loan.offerPrivateData; offerPublic: Loan.offerPublicData};
        shop: {cashToToken: Shop.cashToTokenData; tokenToCash: Shop.tokenToCashData; tokenToToken: Shop.tokenToTokenData};
        trade: {offerPrivate: Trade.offerPrivateData; offerPublic: Trade.offerPublicData; remove: Trade.removeTradeData; takePrivate: Trade.takePrivateData; takePublic: Trade.takePublicData};
    }

    export interface Getters {
        token: {getAll: {gameAddr: addr}; getSpecific: {gameAddr: addr; tokenId: num}; getTokensOf: {gameAddr: addr; userAddr: addr}};
        box: {getAll: {gameAddr: addr}; getDetails: {gameAddr: addr; boxId: num}};
        game: {getAll: {}; getBalanceOf: {gameAddr: addr; userAddr: addr}; getDetails: {gameAddr: addr}};
        loan: {getSpecific: {gameAddr: addr; loanId: num}; getFreeBalanceOf: {gameAddr: addr; userAddr: addr; tokenId: num}; getLoanedBalanceOf: {gameAddr: addr; userAddr: addr; tokenId: num}; getCreatedCount: {gameAddr: addr}; getDeletedCount: {gameAddr: addr}};
        shop: {getOrderCount: {gameAddr: addr};getSpecific: {gameAddr: addr; orderId: num};getUserOrder: {gameAddr: addr; userAddr: addr; orderId: num};getUserOrderCountInGame: {gameAddr: addr; userAddr: addr};getUserOrders: {gameAddr: addr; userAddr: addr}};
        trade: {getClosedCount: {gameAddr: addr}; getOpenCount: {gameAddr: addr}; getSpecific: {gameAddr: addr; index: num}; getUserTradeInGame: {gameAddr: addr; userAddr: addr; index: num}; getUserTradeCount: {gameAddr: addr; userAddr: addr}; getUserTradeIdsInGame: {gameAddr: addr; userAddr: addr}};
    }

    export type APICall<T> = <U = any>(data: T, privKey: str) => AxiosPromise<U>;
    export type APICallGet<T> = <U = any>(params: T) => AxiosPromise<U>;
    export type SetterMap = {[key in keyof Setters]: {[key2 in keyof Setters[key]]: APICall<Setters[key][key2]>}};
    export type SetterObj<T> = {[key in keyof Setters]: {[key2 in keyof Setters[key]]: T}};
    export type GetterMap = {[key in keyof Getters]: {[key2 in keyof Getters[key]]: APICallGet<Getters[key][key2]>}};
}

export type chainFunction<T, U = void> = (user: addr, data: T, ts: num, tsExtra: num, unit: num) => Promise<U>;
export type chainFunction2<T, U = void> = (user: addr, data: T, unit: num) => Promise<U>;
export type chainCall<U = void> = (user: addr, ...args: any[]) => Promise<U>;
export type chainSend<T> = chainFunction<T>;
export type chainSend2<T> = chainFunction2<T>;
export type num = number;    // ----------------------------------- //
export type str = string;    // Short type aliases for common types //
export type addr = address;  // ----------------------------------- //

type GameTypes = Game.deployData | Game.transferData;
type TokenTypes = Token.deployData | Token.mintData | Token.transferData;
type LoanTypes = Loan.offerPublicData | Loan.offerPrivateData | Loan.handlePrivateData | Loan.handlePublicData | Loan.finishData;
type BoxTypes = Box.deployData | Box.updateData | Box.buyData | Box.removeData;
type ShopTypes = Shop.tokenToCashData | Shop.cashToTokenData | Shop.tokenToTokenData;

export type DataTypes = GameTypes | BoxTypes | LoanTypes | TokenTypes | ShopTypes;

export type ArgsTuple<T, U> =
    T extends () => U ? [''] :
    T extends (arg0: infer A) => U ? [A] :
    T extends (arg0: infer A, arg1: infer B) => U ? [A, B] :
    T extends (arg0: infer A, arg1: infer B, arg2: infer C) => U ? [A, B, C] :
    T extends (arg0: infer A, arg1: infer B, arg2: infer C, arg3: infer D) => U ? [A, B, C, D] :
    T extends (arg0: infer A, arg1: infer B, arg2: infer C, arg3: infer D, arg4: infer E) => U ? [A, B, C, D, E] :
    T extends (arg0: infer A, arg1: infer B, arg2: infer C, arg3: infer D, arg4: infer E, arg5: infer F) => U ? [A, B, C, D, E, F] :
    [U];
