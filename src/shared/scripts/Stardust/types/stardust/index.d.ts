import {AxiosPromise} from 'axios';
import {Response} from 'express';

export type valueof<T> = T[keyof T];

export type rarityType = 1 | 2 | 3 | 4 | 5;

type solidityParamSingle = 'bytes32' | 'uint256' | 'address' | 'string' | 'bytes' | 'bool';
type solidityParamArray = 'bytes32[]' | 'uint256[]' | 'address[]' | 'string[]';
export type solidityParam = solidityParamArray | solidityParamSingle;

export type solidityValue = number | string | boolean | ReadonlyArray<number> | ReadonlyArray<string> | ReadonlyArray<boolean>;

export type maybePromise<T> = Promise<T> | T;
export type maybePromisedProps<T> = {[P in keyof T]: maybePromise<T[P]>};

export type logLevel = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error';

export interface JOICheck<T = any> {readonly valid: boolean; readonly value: T;}

interface baseData {readonly gameAddr: addr;}
interface timed {readonly timestamp: number;}
interface Meta extends Readonly<{name: string; desc: string; image: string}> {}

export interface Wallet {readonly address: addr; readonly privateKey: string;}

export type Signed<T>     = T & {readonly signedMessage: string};
export type BulkSigned<T> = T & {readonly signedMessages: string[]};

export namespace API {
    type Endpoint<T> = (data: T, res: Response) => Promise<void>;

    export interface S {
        token: {add: Token.deployDataSigned; mint: Token.mintDataSigned; transfer: Token.transferDataSigned; burn: Token.burnDataSigned};
        box: {add: Box.deployDataSigned; buy: Box.buyDataSigned; remove: Box.removeDataSigned; update: Box.updateDataSigned};
        game: {deploy: Game.deployDataSigned; transfer: Game.transferDataSigned};
        loan: {finish: Loan.finishDataSigned; handlePrivate: Loan.handlePrivateDataSigned; handlePublic: Loan.handlePrivateDataSigned; offerPrivate: Loan.offerPrivateDataSigned; offerPublic: Loan.offerPublicDataSigned};
        shop: {cashToToken: Shop.cashToTokenDataSigned; tokenToCash: Shop.tokenToCashDataSigned; tokenToToken: Shop.tokenToTokenDataSigned};
        trade: {offerPrivate: Trade.offerPrivateDataSigned; offerPublic: Trade.offerPublicDataSigned; remove: Trade.removeTradeDataSigned; takePrivate: Trade.takePrivateDataSigned; takePublic: Trade.takePublicDataSigned};
        user: {generate: {gameAddr: string}};
    }

    export type Setter<K1 extends keyof S, K2 extends keyof S[K1]> = Endpoint<S[K1][K2]>;

    export interface G {
        token: {getAll: {gameAddr: addr}; getOne: {gameAddr: addr; tokenId: number}; getDetails: {gameAddr: addr; tokenId?: number}; getTokensOf: {gameAddr: addr; userAddr: addr}; getAllTokensOf: {userAddr: addr}};
        box: {getOne: {gameAddr: addr; boxId: number}; getAll: {gameAddr: addr}; getDetails: {gameAddr: addr; boxId?: number}};
        game: {getAll: {}; getOne: {gameAddr: addr}; getBalanceOf: {gameAddr: addr; userAddr: addr}; getDetails: {gameAddr?: addr}};
        loan: {getCreatedCount: {gameAddr: addr}; getDeletedCount: {gameAddr: addr}; getSpecific: {gameAddr: addr; loanId: number}; getLoanedBalanceOf: {gameAddr: addr; userAddr: addr; tokenId: number}; getFreeBalanceOf: {gameAddr: addr; userAddr: addr; tokenId: number}};
        shop: {getOrderCount: {gameAddr: addr}; getUserOrderCount: {userAddr: addr}; getUserOrderCountInGame: {gameAddr: addr; userAddr: addr}; getSpecific: {gameAddr: addr; orderId: number}; getOneUserOrder: {gameAddr: addr; userAddr: addr; orderId: number}; getAllUserOrders: {gameAddr: addr; userAddr: addr}; getUserOrderDetails: {gameAddr: addr; userAddr: addr; orderId?: number}};
        trade: {getAll: {}; getGameOpenCount: {gameAddr: addr}; getGameClosedCount: {gameAddr: addr}; getGameTrade: {gameAddr: addr; index: number}; getGameTrades: {gameAddr: addr}; getGameDetails: {gameAddr: addr; index?: number}; getUserTradeCount: {userAddr: addr}; getUserTradeCountInGame: {gameAddr: addr; userAddr: addr}; getUserTradeCountDetails: {gameAddr?: addr; userAddr: addr}; getUserTradeIds: {userAddr: addr}; getUserTradeIdsInGame: {gameAddr: addr; userAddr: addr}; getUserTradeInGame: {gameAddr: addr; userAddr: addr; index: number}; getUserTradesInGame: {gameAddr: addr; userAddr: addr}; getUserTrades: {userAddr: addr}};
        tx: {getStatus: {txId: string; blocking?: boolean}; getData: {txId: string; blocking?: boolean}};
    }

    export type Getter<K1 extends keyof G, K2 extends keyof G[K1]> = Endpoint<G[K1][K2]>;

    export interface baseErrorsObj {readonly timestamp?: string; readonly signer?: string; readonly hash?: string; readonly rarity_cap?: string; readonly tokens?: string;}
}

export namespace IPFSMeta {
    export type TokenData = Meta & Readonly<{tokenId: number; rarity: number; cap: number}>;
    export type BoxData = Meta & Readonly<{boxId: number}>;
    export type GameData = Meta & baseData & Readonly<{symbol: string; rarityNames: ReadonlyArray<string>}>;
    export type GameDataFile = Readonly<{game: GameData; tokens: ReadonlyArray<TokenData>; boxes: ReadonlyArray<BoxData>}>;
}

export namespace Token {
    export interface metaData extends baseData, Meta, Readonly<{tokenId: number; rarity: number; cap: number; val: number; owners: ReadonlyArray<addr>; totalSupply: number}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface deployData extends baseData, timed, Meta, Readonly<{cap: number; rarity: rarityType; val: number}> {}
    export interface deployDataContract extends baseData, timed, Readonly<{cap: number; rarity: rarityType; val: number}> {}
    export interface deployDataSigned extends Signed<deployData> {}

    export interface mintData extends baseData, timed, Readonly<{tokenId: number; to: addr; amount: number}> {}
    export interface mintDataSigned extends Signed<mintData> {}

    export interface transferData extends baseData, timed, Readonly<{from: addr; to: addr; amount: number; tokenId: number}> {}
    export interface transferDataSigned extends Signed<transferData> {}

    export interface burnData extends baseData {readonly from: addr; readonly amount: number; readonly timestamp: number; readonly tokenId: number; readonly gameAddr: addr;}
    export interface burnDataSigned extends Signed<burnData> {}
}

export namespace Box {
    export interface metaData extends baseData, Meta, Readonly<{boxId: number; isValid: boolean; tokens: ReadonlyArray<number>}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface deployDataContract extends baseData, timed {readonly tokens: number[];}
    export interface deployData extends Meta, deployDataContract {}
    export interface deployDataSigned extends Signed<deployData> {}

    export interface removeData extends baseData, timed {readonly boxId: number;}
    export interface removeDataSigned extends Signed<removeData> {}

    export interface updateData extends baseData, timed, Meta, Readonly<{boxId: number; isValid: boolean; tokens: number[]}> {}
    export interface updateDataContract extends baseData, timed, Readonly<{boxId: number; isValid: boolean; tokens: number[]}> {}
    export interface updateDataSigned extends Signed<updateData> {}

    export interface buyData extends baseData, timed {readonly boxId: number;}
    export interface buyDataSigned extends Signed<buyData> {}
}

export namespace Game {
    export interface metaData extends baseData, Meta, Readonly<{gameOwner: addr; rarityNames: ReadonlyArray<string>; rarityPercs: ReadonlyArray<number>; symbol: string; totalSupply: number}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface deployData extends timed, Readonly<{name: string; symbol: string; desc: string; image: string; owner: addr; rarityPercs: ReadonlyArray<number>; rarityNames: ReadonlyArray<string>}> {}
    export interface deployDataSigned extends Signed<deployData> {}

    export interface transferData extends baseData {readonly from: addr; readonly to: addr; timestamp: number;}
    export interface transferDataSigned extends Signed<transferData> {}
}

export namespace Loan {
    export interface metaData extends baseData, Readonly<{loanId: number; isActive: boolean; lender: addr; borrower: addr; tokenId: number; amount: number; start: number; length: number}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray extends baseData, Readonly<{isActive: ReadonlyArray<boolean>; lender: ReadonlyArray<addr>; borrower: ReadonlyArray<addr>; tokenId: ReadonlyArray<number>; amount: ReadonlyArray<number>; start: ReadonlyArray<number>; length: ReadonlyArray<number>}> {}

    export interface offerPrivateData extends baseData {readonly lender: addr; readonly borrower: addr; readonly tokenId: number; readonly amount: number; readonly length: number; timestamp: number;}
    export interface offerPrivateDataSigned extends Signed<offerPrivateData> {}

    export interface offerPublicData extends baseData, timed, Readonly<{lender: addr; tokenId: number; amount: number; length: number}> {}
    export interface offerPublicDataSigned extends Signed<offerPublicData> {}

    export interface handlePublicData extends baseData, timed, Readonly<{loanId: number}> {}
    export interface handlePublicDataSigned extends Signed<handlePublicData> {}

    export interface handlePrivateData extends baseData, timed, Readonly<{loanId: number; decision: boolean}> {}
    export interface handlePrivateDataSigned extends Signed<handlePrivateData> {}

    export interface finishData extends baseData, timed {readonly loanId: number;}
    export interface finishDataSigned extends Signed<finishData> {}
}

export namespace Shop {
    export interface metaData extends baseData, Readonly<{id: number; tokenId: number; amount: number; created: number; gameAddr: addr; caller: addr}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray extends Readonly<{ids: number[]; tokenIds: number[]; amounts: number[]; createds: number[]; gameAddrs: addr[]; callers: addr[]}> {}

    export interface tokenToCashData extends baseData, timed, Readonly<{tokenId: number; amount: number}> {}
    export interface tokenToCashDataSigned extends Signed<tokenToCashData> {}

    export interface cashToTokenData extends baseData, timed, Readonly<{tokenId: number; amount: number}> {}
    export interface cashToTokenDataSigned extends Signed<cashToTokenData> {}

    export interface tokenToTokenData extends baseData, timed, Readonly<{fromId: number; fromAmount: number; toId: number; toAmount: number}> {}
    export interface tokenToTokenDataSigned extends Signed<tokenToTokenData> {}
}

export namespace Trade {
    export interface metaData extends baseData, Readonly<{taker: addr; trader: addr; offeredId: number; offeredAmount: number; wantedId: number; wantedAmount: number; createdOn: number; state: number}> {}
    export interface promisedMetaData extends maybePromisedProps<metaData> {}

    export interface metaDataArray extends baseData, Readonly<{takers: addr[]; traders: addr[]; offeredIds: number[]; offeredAmounts: number[]; wantedIds: number[]; wantedAmounts: number[]; createdOns: number[]; states: number[]}> {}

    export interface offerPrivateData extends baseData, timed, Readonly<{taker: addr; offeredId: number; offeredAmount: number; wantedId: number; wantedAmount: number}> {}
    export interface offerPrivateDataSigned extends Signed<offerPrivateData> {}

    export interface offerPublicData extends baseData, timed, Readonly<{offeredId: number; offeredAmount: number; wantedId: number; wantedAmount: number}> {}
    export interface offerPublicDataSigned extends Signed<offerPublicData> {}

    export interface takePrivateData extends baseData, timed, Readonly<{index: number}> {}
    export interface takePrivateDataSigned extends Signed<takePrivateData> {}

    export interface takePublicData extends baseData, timed, Readonly<{index: number}> {}
    export interface takePublicDataSigned extends Signed<takePublicData> {}

    export interface removeTradeData extends baseData, timed, Readonly<{index: number}> {}
    export interface removeTradeDataSigned extends Signed<removeTradeData> {}
}

export namespace Wrapper {
    export interface Setters {
        token: {add: Token.deployData; burn: Token.burnData; mint: Token.mintData; transfer: Token.transferData};
        box: {add: Box.deployData; buy: Box.buyData; remove: Box.removeData; update: Box.updateData};
        game: {deploy: Game.deployData; transfer: Game.transferData};
        loan: {finish: Loan.finishData; handlePrivate: Loan.handlePrivateData; handlePublic: Loan.handlePublicData; offerPrivate: Loan.offerPrivateData; offerPublic: Loan.offerPublicData};
        shop: {cashToToken: Shop.cashToTokenData; tokenToCash: Shop.tokenToCashData; tokenToToken: Shop.tokenToTokenData};
        trade: {offerPrivate: Trade.offerPrivateData; offerPublic: Trade.offerPublicData; remove: Trade.removeTradeData; takePrivate: Trade.takePrivateData; takePublic: Trade.takePublicData};
        user: {generate: {gameAddr: string}};
    }

    type APICall<T> = <U = any>(data: T, privKey: str, dataOnly?: boolean) => AxiosPromise<U>;
    type APICallGet<T> = <U = any>(params: T, dataOnly?: boolean) => AxiosPromise<U>;
    type APICallGet2<T> = <U = any>(params: T, dataOnly?: boolean) => U;
    export type SetterMap    = {[key in keyof Setters]: {[key2 in keyof Setters[key]]: APICall<Setters[key][key2]>}};
    export type GetterMap    = {[key in keyof API.G]: {[key2 in keyof API.G[key]]: APICallGet<API.G[key][key2]>}};
    export type GetterMap2    = {[key in keyof API.G]: {[key2 in keyof API.G[key]]: APICallGet2<API.G[key][key2]>}};
    export type SetterOf<T>    = {[key in keyof API.S]: {[key2 in keyof API.S[key]]: T}};

    type hashFunc<T> = (data: T) => string;
    type hashAndSignFunc<T> = (data: T, privKey: string) => string;
    type postJSONFunc<T>    = (data: T, privKey: string) => T & {signedMessage: string};
    export type HashObjType = {[key1 in keyof Setters]: {[key2 in keyof Setters[key1]]: hashFunc<Setters[key1][key2]>; }};
    export type HashAndSignObjType = {[key1 in keyof Setters]: {[key2 in keyof Setters[key1]]: hashAndSignFunc<Setters[key1][key2]>;}};
    export type PostJSONObjType = {[key1 in keyof Setters]: {[key2 in keyof Setters[key1]]: postJSONFunc<Setters[key1][key2]>;}};
}

export type num = number;    // ----------------------------------- //
export type str = string;    // Short type aliases for common types //
export type addr = string;   // ----------------------------------- //

type DataTypesOf<T extends keyof Wrapper.Setters> = valueof<Wrapper.Setters[T]>;

export type DataTypes = DataTypesOf<'game'> |
    DataTypesOf<'token'> |
    DataTypesOf<'shop'>  |
    DataTypesOf<'box'>   |
    DataTypesOf<'loan'>  |
    DataTypesOf<'trade'>;
