import {DataTypes, hexString, keccak256Hash, solidityParam, solidityValue, Wallet, Wrapper} from './types';

// import * as paramType from './data/paramtype.json';
// import * as paramTypes from './data/paramtypes.json';

// import * as routesObj from './data/routes.json';

import axios from 'axios';
import {fromPairs} from 'ramda';

const paramType = {
    "address": ["borrower", "owner", "lender", "taker", "to", "from", "gameAddr"],
    "bool": ["decision", "isValid"],
    "string": ["name", "image", "desc", "symbol"],
    "uint256": ["tokenId", "amount", "boxId", "cap", "loanId", "index", "offeredAmount", "offeredId", "rarity", "timestamp", "val", "wantedAmount", "wantedId", "length", "fromId", "toId", "toAmount", "fromAmount"],
    "uint256[]": ["tokens"]
};

const paramTypes = {
    "game": {
        "deploy": ["owner", "name", "symbol", "desc", "image", "timestamp"],
        "transfer": ["gameAddr", "from", "to", "timestamp"]
    },
    "token": {
        "add": ["gameAddr", "name", "rarity", "cap", "val", "desc", "image", "timestamp"],
        "mint": ["gameAddr", "tokenId", "to", "amount", "timestamp"],
        "transfer": ["gameAddr","tokenId","from","to","amount","timestamp"]
    },
    "loan": {
        "offerPrivate": ["gameAddr", "lender", "borrower", "tokenId", "amount", "length", "timestamp"],
        "offerPublic": ["gameAddr", "lender", "tokenId", "amount", "length", "timestamp"],
        "handlePrivate": ["gameAddr", "loanId", "decision", "timestamp"],
        "handlePublic": ["gameAddr", "loanId", "timestamp"],
        "finish": ["gameAddr", "loanId", "timestamp"]
    },
    "box": {
        "add": ["gameAddr", "name", "desc", "image", "tokens", "timestamp"],
        "update": ["gameAddr", "boxId", "isValid", "name", "desc", "image", "tokens", "timestamp"],
        "buy": ["gameAddr", "boxId", "timestamp"],
        "remove": ["gameAddr", "boxId", "timestamp"]
    },
    "shop": {
        "tokenToCash": ["gameAddr", "tokenId", "amount", "timestamp"],
        "cashToToken": ["gameAddr", "tokenId", "amount", "timestamp"],
        "tokenToToken": ["gameAddr", "fromId", "fromAmount", "toId", "toAmount", "timestamp"]
    },
    "trade": {
        "offerPrivate": ["gameAddr", "taker", "offeredId", "offeredAmount", "wantedId", "wantedAmount","timestamp"],
        "offerPublic": ["gameAddr", "offeredId", "offeredAmount", "wantedId", "wantedAmount", "timestamp"],
        "takePrivate": ["gameAddr", "index", "timestamp"],
        "takePublic": ["gameAddr","index","timestamp"],
        "remove": ["gameAddr", "index", "timestamp"]
    }
};

const routesObj = {
    "getters": {
        "token": {
            "getHash": ["/tokens/token-hash"],
            "getTokensOf": ["/tokensOf"],
            "getDetails": ["/tokens"],
            "getAll": ["/tokens"]
        },
        "box": {
            "getHash": ["/boxes/box-hash"],
            "getDetails": ["/boxes"],
            "getAll": ["/boxes"]
        },
        "game": {
            "getBalanceOf": ["/games/balance"],
            "getHash": ["/games/hash"],
            "getDetails": ["/games"],
            "getAll": ["/games"]
        },
        "loan": {
            "getCreatedCount": ["/loans/created-loans-count"],
            "getDeletedCount": ["/loans/deleted-loans-count"],
            "getFreeBalanceOf": ["/loans/free-balance-of"],
            "getLoanedBalanceOf": ["/loans/loaned-balance-of"],
            "getSpecific": ["/loans"]
        },
        "shop": {
            "getOrderCount": ["/shop/order-count"],
            "getSpecific": ["/shop/orders"],
            "getUserOrderCountInGame": ["/shop/orders/count"],
            "getUserOrderDetails": ["/shop/game-orders"],
            "getUserOrders": ["/shop/game-orders"],
            "getUserOrder": ["/shop/game-orders"]
        },
        "trade": {
            "getClosedCount": ["/trades/closed-count"],
            "getOpenCount": ["/trades/open-count"],
            "getTrade": ["/trades"],
            "getUserTradeInGame": ["/trades/game"],
            "getUserTradeCountDetails": ["/trades/user-count"],
            "getUserTradeIdsInGame": ["/trades/game/id"]
        }
    },
    "setters": {
        "token": {
            "add": {
                "routes": ["/tokens"],
                "paramKeys": ["gameAddr"]
            },
            "mint": {
                "routes": ["/tokens/mint"],
                "paramKeys": ["gameAddr", "tokenId"]
            },
            "transfer": {
                "routes": ["/tokens/transfer"],
                "paramKeys": ["gameAddr", "tokenId"]
            }
        },
        "box": {
            "add": {
                "routes": ["/boxes"],
                "paramKeys": ["gameAddr"]
            },
            "buy": {
                "routes": ["/boxes/buy"],
                "paramKeys": ["gameAddr",
                    "boxId"]
            },
            "remove": {
                "routes": ["/boxes/delete"],
                "paramKeys": ["gameAddr", "boxId"]
            },
            "update": {
                "routes": ["/boxes/update"],
                "paramKeys": ["gameAddr", "boxId"]
            }
        },
        "game": {
            "deploy": {
                "routes": ["/games"],
                "paramKeys": ['']
            },
            "transfer": {
                "routes": ["/games/transfer"],
                "paramKeys": ["gameAddr"]
            }
        },
        "loan": {
            "finish": {
                "routes": ["/loans/finish"],
                "paramKeys": ["gameAddr", "loanId"]
            },
            "handlePrivate": {
                "routes": ["/loans/handle-private"],
                "paramKeys": ["gameAddr", "loanId"]
            },
            "handlePublic": {
                "routes": ["/loans/handle-public"],
                "paramKeys": ["gameAddr", "loanId"]
            },
            "offerPrivate": {
                "routes": ["/loans/offer-private"],
                "paramKeys": ["gameAddr", "tokenId"]
            },
            "offerPublic": {
                "routes": ["/loans/offer-public"],
                "paramKeys": ["gameAddr", "tokenId"]
            }
        },
        "shop": {
            "cashToToken": {
                "routes": ["/shop/cash-to-token"],
                "paramKeys": ["gameAddr"]
            },
            "tokenToCash": {
                "routes": ["/shop/token-to-cash"],
                "paramKeys": ["gameAddr"]
            },
            "tokenToToken": {
                "routes": ["/shop/token-to-token"],
                "paramKeys": ["gameAddr"]
            }
        },
        "trade": {
            "offerPrivate": {
                "routes": ["/trades/offer-private"],
                "paramKeys": ["gameAddr"]
            },
            "offerPublic": {
                "routes": ["/trades/offer-public"],
                "paramKeys": ["gameAddr"]
            },
            "remove": {
                "routes": ["/trades/remove"],
                "paramKeys": ["gameAddr", "index"]
            },
            "takePrivate": {
                "routes": ["/trades/take-private"],
                "paramKeys": ["gameAddr",  "index"]
            },
            "takePublic": {
                "routes": ["/trades/take-public"],
                "paramKeys": ["gameAddr", "index"]
            }
        }
    }
};

// import Web3 from 'web3';
const Web3 = require('web3');
const web3 = new Web3();

interface sigObj {readonly message: string; readonly signature: string;}

type X = Wrapper.Setters;

type hashFunc<T>        = (data: T) => keccak256Hash;
type hashAndSignFunc<T> = (data: T, privKey: hexString) => hexString;
type postJSONFunc<T>    = (data: T, privKey: hexString) => T & {signedMessage: hexString};

type HashObjType           = {[key1 in keyof X]: {[key2 in keyof X[key1]]: hashFunc<X[key1][key2]>; }};
type HashAndSignObjType    = {[key1 in keyof X]: {[key2 in keyof X[key1]]: hashAndSignFunc<X[key1][key2]>;}};
type CreatePostJSONObjType = {[key1 in keyof X]: {[key2 in keyof X[key1]]: postJSONFunc<X[key1][key2]>;}};

// ! const invParamTypes = invertObj(paramType);

const objMap = <T>(obj: T, f: any) => Object.assign({}, ...Object.entries(obj).map(([k, val]) => ({[k]: f(val)})));
const secondLevelMap = <T, U>(obj: T, f: any) => objMap(obj, (a: U) => objMap(a, f));

const sigToString = (sig: sigObj): hexString => sig.signature + sig.message.slice(2);

const signRaw = (msg: string, privKey: string): sigObj => web3.eth.accounts.sign(msg, privKey);
export const createRawWallet = (): Wallet => web3.eth.accounts.create();

export const createWallet = () => {
    const{address, privateKey} = createRawWallet();
    return[address, privateKey];
};

const sign = (msg: string, privKey: string) => sigToString(signRaw(msg, privKey));

const hashParam  = (value: solidityValue, type: solidityParam) => web3.utils.soliditySha3(web3.eth.abi.encodeParameter(type, value));
const hashParams = (values: ReadonlyArray<solidityValue>, types: ReadonlyArray<solidityParam>) => values.map((value, index) => hashParam(value, types[index]));

const combineHashes = (hashes: ReadonlyArray<keccak256Hash>) => hashParam(hashes, 'bytes32[]');
// ! const getParamType  = (y: keyof typeof invParamTypes) => ({[y]: invParamTypes[y] as solidityParam});
const getParamType = (y: string): {[key: string]: solidityParam} => ({[y]: Object.keys(paramType).filter((k) => k !== 'default' && (paramType as any)[k].includes(y))[0] as solidityParam});

const hashMany = <T>(key1: string, key2: string) => (values: T) => {
    const paramTypeArray = (paramTypes as any)[key1][key2].map(getParamType) as Array<{[key: string]: solidityParam}>;
    const valuesArr = paramTypeArray.map((param) => (values as any)[Object.keys(param)[0]]);
    const types = paramTypeArray.map((param) => Object.values(param)[0]);
    return combineHashes(hashParams(valuesArr, types));
};

const combine = <U>() => <T>(pathsMapped: Array<{key1: keyof U; key2: string; func: T}>) => pathsMapped.reduce((prev, {key1, key2, func}) => {
    // const toAdd = ((key1 in prev) ? prev[key1] : {});
    return Object.assign(
        {}, prev,
        {
            [key1] : Object.assign(
                {}, ((key1 in prev) ? prev[key1] : {}),
                { [key2]: func }
            )
        }
    );
}, {} as U);

const createHashAndSign = <T extends DataTypes>(f: hashFunc<T>): hashAndSignFunc<T> => (data, privKey) => sign(f(data), privKey);
const createPostJSONF   = <T extends DataTypes>(f: hashFunc<T>): postJSONFunc<T> => (data, privKey) => (
    Object.assign({}, data, {signedMessage: sign(f(data), privKey)})
);

const paths = <T>(obj: {[key1: string]: {[key2: string]: T}}) => Object.entries(obj).map(([key1, val]) => Object.keys(val).map((key2) => ({key1, key2}))).reduce((prev, curr) => [...prev, ...curr], []);
const pathsMap = <T, U>(obj: {[key1: string]: {[key2: string]: T}}, f: (a: string, b: string) => U) => paths(obj).map(({key1, key2}) => ({key1, key2, func: f(key1, key2)})) as Array<{key1: keyof U; key2: string; func: U}>;

// ! ------------------------------------------------------
const v = 'v1';
// process.env.GAME_API || `http://api.sandbox.stardust.com/${v}`
const wrapper = (baseURL = `http://api.sandbox.stardust.com/${v}`) => axios.create({
    baseURL,
    timeout: 25000,
    headers: {'Content-Type': 'application/json'}
});

export const hash = combine<HashObjType>()(pathsMap((routesObj as any).setters, hashMany));
export const hashAndSign: HashAndSignObjType = secondLevelMap(hash, createHashAndSign);
export const createPostJSON: CreatePostJSONObjType = secondLevelMap(hash, createPostJSONF);

const pluck = <T, K extends keyof T>(obj: T, names: K[]) => fromPairs(Object.entries(obj).filter(([key]) => names.includes(key as K))) as Pick<T, K>;

const createPost = (baseURL: string) => (key1: string, key2: string) => async<T>(data: T, privKey: string) => {
    const {routes, paramKeys} = (routesObj as any).setters[key1][key2] as {routes: string[]; paramKeys: Array<keyof T>};
    const postJSON = (createPostJSON as any)[key1][key2] as postJSONFunc<T>;
    return wrapper(baseURL).post(routes[0], postJSON(data, privKey), {params: pluck(data, paramKeys)});
};

const createGet = (baseURL: string) => (key1: string, key2: string) => async<U>(params: U) => wrapper(baseURL).get((routesObj as any).getters[key1][key2][0], {params});

export const stardustAPI = (baseURL: string) => {
    const getters = combine<Wrapper.GetterMap>()(pathsMap((routesObj as any).getters, createGet(baseURL)));
    const setters = combine<Wrapper.SetterMap>()(pathsMap((routesObj as any).setters, createPost(baseURL)));
    return {setters, getters};
};
