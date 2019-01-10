import {Asset, Box, DataTypes, Game, hexString, keccak256Hash, Loan, Shop, solidityParam, solidityValue, Trade, Wallet, Wrapper} from './types';

import axios from 'axios';
import {fromPairs} from 'ramda';
// import Web3 from 'web3';
const Web3 = require('web3');
const web3 = new Web3();

interface sigObj {readonly message: string; readonly signature: string;}
interface HashObjType {[key: string]: { [key: string]: hashFunc<any>};}

type FirstInput<T> = T extends (arg: infer R) => any ? R : never;
type CreatePostJSON2<T extends DataTypes> = (f: hashFunc<T>) => postJSONFunc<T>;

type CreatePostJSONObjType<T extends HashObjType> = {
    [key1 in keyof T]: {
        [key2 in keyof T[key1]]: ReturnType<CreatePostJSON2<FirstInput<T[key1][key2]>>>;
    }
};

type hashFunc<T> = (data: T) => keccak256Hash;
type hashAndSignFunc<T> = (data: T, privKey: hexString) => hexString;
type postJSONFunc<T> = (data: T, privKey: hexString) => T & {signedMessage: hexString};

const gameParamTypes: ReadonlyArray<solidityParam>              = ['address', 'string', 'string', 'string', 'string', 'uint256'];
const gameTransferParamTypes: ReadonlyArray<solidityParam>      = ['address', 'address', 'address', 'uint256'];

const mintParamTypes: ReadonlyArray<solidityParam>              = ['address', 'uint256', 'address', 'uint256', 'uint256'];
const assetParamTypes: ReadonlyArray<solidityParam>             = ['address', 'string', 'uint256', 'uint256', 'uint256', 'string', 'string', 'uint256'];
const tradeParamTypes: ReadonlyArray<solidityParam>             = ['address', 'uint256', 'address', 'address', 'uint256', 'uint256'];

const offerPrivateLoanParamTypes: ReadonlyArray<solidityParam>  = ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'];
const offerPublicLoanParamTypes: ReadonlyArray<solidityParam>   = ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'];
const handlePrivateLoanParamTypes: ReadonlyArray<solidityParam> = ['address', 'uint256', 'bool', 'uint256'];
const handlePublicLoanParamTypes: ReadonlyArray<solidityParam>  = ['address', 'uint256', 'uint256'];
const finishLoanParamTypes: ReadonlyArray<solidityParam>        = ['address', 'bool', 'uint256'];

const boxCreateParamTypes: ReadonlyArray<solidityParam>         = ['address', 'string', 'string', 'string', 'uint256[]', 'uint256'];
const boxUpdateParamTypes: ReadonlyArray<solidityParam>         = ['address', 'uint256', 'bool', 'string', 'string', 'string', 'uint256[]', 'uint256'];
const boxBuyParamTypes: ReadonlyArray<solidityParam>            = ['address', 'uint256', 'uint256'];
const boxRemoveParamTypes: ReadonlyArray<solidityParam>         = ['address', 'uint256', 'uint256'];

const tokenToCashParamTypes: ReadonlyArray<solidityParam>       = ['address', 'uint256', 'uint256', 'uint256'];
const cashToTokenParamTypes: ReadonlyArray<solidityParam>       = ['address', 'uint256', 'uint256', 'uint256'];
const tokenToTokenParamTypes: ReadonlyArray<solidityParam>      = ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'];

const offerPrivateTradeParamTypes: ReadonlyArray<solidityParam> = ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'];
const offerPublicTradeParamTypes: ReadonlyArray<solidityParam>  = ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'];
const takePrivateParamTypes: ReadonlyArray<solidityParam>       = ['address', 'uint256', 'uint256'];
const takePublicParamTypes: ReadonlyArray<solidityParam>        = ['address', 'uint256', 'uint256'];
const removeTradeParamTypes: ReadonlyArray<solidityParam>       = ['address', 'uint256', 'uint256'];

const objMap = <T>(obj: T, f: any) => Object.assign({}, ...Object.entries(obj).map(([k, v]) => ({[k]: f(v)})));
const secondLevelMap = <T, U>(obj: T, f: any) => objMap(obj, (x: U) => objMap(x, f));

const sigToString = (sig: sigObj): hexString => sig.signature + sig.message.slice(2);

const signRaw = (msg: string, privKey: string): sigObj => web3.eth.accounts.sign(msg, privKey);
export const createRawWallet = (): Wallet => web3.eth.accounts.create();

export const createWallet = (): ReadonlyArray<string> => {
    const{address, privateKey}: Wallet = createRawWallet();
    return[address, privateKey];
};

const sign: (msg: string, privKey: string) => string = (msg, privKey) => sigToString(signRaw(msg, privKey));

const hashParam: (value: solidityValue, type: solidityParam) => keccak256Hash = (value, type) => web3.utils.soliditySha3(web3.eth.abi.encodeParameter(type, value));
const hashParams: (values: ReadonlyArray<solidityValue>, types: ReadonlyArray<solidityParam>) => ReadonlyArray<keccak256Hash> = (values, types) => values.map((value, index) => hashParam(value, types[index]));

const combineHashes: (hashes: ReadonlyArray<keccak256Hash>) => keccak256Hash = (hashes) => hashParam(hashes, 'bytes32[]');
const hashMany: (values: ReadonlyArray<solidityValue>, types: ReadonlyArray<solidityParam>) => keccak256Hash = (values, types) => combineHashes(hashParams(values, types));

// tslint:disable:typedef-whitespace
// tslint:disable:space-within-parens
const hashGame:              hashFunc<Game.deployData>        = ({owner, name, symbol, desc, image, timestamp})                                  => hashMany([owner, name, symbol, desc, image, timestamp],                    gameParamTypes);
const hashGameTransfer:      hashFunc<Game.transferData>      = ({gameAddr, from, to, timestamp})                                                => hashMany([gameAddr, from, to, timestamp],                                  gameTransferParamTypes);
const hashAsset:             hashFunc<Asset.deployData>       = ({gameAddr, name, rarity, cap, val, desc, image, timestamp})                     => hashMany([gameAddr, name, rarity, cap, val, desc, image, timestamp],       assetParamTypes);
const hashAssetMint:         hashFunc<Asset.mintData>         = ({gameAddr, assetId, to, amount, timestamp})                                     => hashMany([gameAddr, assetId, to, amount, timestamp],                       mintParamTypes);
const hashAssetTrade:        hashFunc<Asset.tradeData>        = ({gameAddr, assetId, from, to, amount, timestamp})                               => hashMany([gameAddr, assetId, from, to, amount, timestamp],                 tradeParamTypes);
const hashLoanOfferPublic:   hashFunc<Loan.offerPublicData>   = ({gameAddr, lender, assetId, amount, length, timestamp})                         => hashMany([gameAddr, lender, assetId, amount, length, timestamp],           offerPublicLoanParamTypes);
const hashLoanOfferPrivate:  hashFunc<Loan.offerPrivateData>  = ({gameAddr, lender, borrower, assetId, amount, length, timestamp})               => hashMany([gameAddr, lender, borrower, assetId, amount, length, timestamp], offerPrivateLoanParamTypes);
const hashLoanHandlePrivate: hashFunc<Loan.handlePrivateData> = ({gameAddr, loanId, decision, timestamp})                                        => hashMany([gameAddr, loanId, decision, timestamp],                          handlePrivateLoanParamTypes);
const hashLoanHandlePublic:  hashFunc<Loan.handlePublicData > = ({gameAddr, loanId, timestamp})                                                  => hashMany([gameAddr, loanId, timestamp],                                    handlePublicLoanParamTypes);
const hashLoanFinish:        hashFunc<Loan.finishData>        = ({gameAddr, loanId, timestamp})                                                  => hashMany([gameAddr, loanId, timestamp],                                    finishLoanParamTypes);
const hashBox:               hashFunc<Box.deployData>         = ({gameAddr, name, desc, image, tokens, timestamp})                               => hashMany([gameAddr, name, desc, image, tokens, timestamp],                 boxCreateParamTypes);
const hashBoxUpdate:         hashFunc<Box.updateData>         = ({gameAddr, boxId, isValid, name, desc, image, tokens, timestamp})               => hashMany([gameAddr, boxId, isValid, name, desc, image, tokens, timestamp], boxUpdateParamTypes);
const hashBoxBuy:            hashFunc<Box.buyData>            = ({gameAddr, boxId, timestamp})                                                   => hashMany([gameAddr, boxId, timestamp],                                     boxBuyParamTypes);
const hashBoxRemove:         hashFunc<Box.removeData>         = ({gameAddr, boxId, timestamp})                                                   => hashMany([gameAddr, boxId, timestamp],                                     boxRemoveParamTypes);
const hashTokenToCash:       hashFunc<Shop.tokenToCashData>   = ({gameAddr, assetId, amount, timestamp})                                         => hashMany([gameAddr, assetId, amount, timestamp],                           tokenToCashParamTypes);
const hashCashToToken:       hashFunc<Shop.cashToTokenData>   = ({gameAddr, assetId, amount, timestamp})                                         => hashMany([gameAddr, assetId, amount, timestamp],                           cashToTokenParamTypes);
const hashTokenToToken:      hashFunc<Shop.tokenToTokenData>  = ({gameAddr, fromId, fromAmount, toId, toAmount, timestamp})                      => hashMany([gameAddr, fromId, fromAmount, toId, toAmount, timestamp],        tokenToTokenParamTypes);
const hashOfferPrivateTrade: hashFunc<Trade.offerPrivateData> = ({gameAddr, taker, offeredId, offeredAmount, wantedId, wantedAmount, timestamp}) => hashMany([gameAddr, taker, offeredId, offeredAmount, wantedId, wantedAmount, timestamp], offerPrivateTradeParamTypes);
const hashOfferPublicTrade:  hashFunc<Trade.offerPublicData>  = ({gameAddr, offeredId, offeredAmount, wantedId, wantedAmount, timestamp})        => hashMany([gameAddr, offeredId, offeredAmount, wantedId, wantedAmount, timestamp], offerPublicTradeParamTypes);
const hashTakePrivateTrade:  hashFunc<Trade.takePrivateData>  = ({gameAddr, index, timestamp})                                                   => hashMany([gameAddr, index, timestamp], takePrivateParamTypes);
const hashTakePublicTrade:   hashFunc<Trade.takePublicData>   = ({gameAddr, index, timestamp})                                                   => hashMany([gameAddr, index, timestamp], takePublicParamTypes);
const hashRemoveTrade:       hashFunc<Trade.removeTradeData>  = ({gameAddr, index, timestamp})                                                   => hashMany([gameAddr, index, timestamp], removeTradeParamTypes);
// tslint:enable:typedef-whitespace
// tslint:enable:space-within-parens

const createHashAndSign = <T extends DataTypes>(f: hashFunc<T>): hashAndSignFunc<T> => (data, privKey) => sign(f(data), privKey);
const createPostJSON1   = <T extends DataTypes>(f: hashAndSignFunc<T>): postJSONFunc<T> => (data, privKey) => (Object.assign({}, data, {signedMessage: f(data, privKey)}));
const createPostJSON2   = <T extends DataTypes>(f: hashFunc<T>): postJSONFunc<T> => createPostJSON1(createHashAndSign(f));

const asset = {add: hashAsset,mint: hashAssetMint, trade: hashAssetTrade};
const box = {add: hashBox, buy: hashBoxBuy, remove: hashBoxRemove, update: hashBoxUpdate};
const game = {deploy: hashGame, transfer: hashGameTransfer};
const loan = {finish: hashLoanFinish, handlePrivate: hashLoanHandlePrivate, handlePublic: hashLoanHandlePublic, offerPrivate: hashLoanOfferPrivate, offerPublic: hashLoanOfferPublic};
const shop = {cashToToken: hashCashToToken, tokenToCash: hashTokenToCash, tokenToToken: hashTokenToToken};
const trade = {offerPrivate: hashOfferPrivateTrade, offerPublic: hashOfferPublicTrade, takePrivate: hashTakePrivateTrade, takePublic: hashTakePublicTrade, remove: hashRemoveTrade};

const hash = {asset, box, game, loan, shop, trade};
const createPostJSON: CreatePostJSONObjType<typeof hash> = secondLevelMap(hash, createPostJSON2);

const v = 'v1';
export const wrapper = axios.create({
    baseURL: process.env.GAME_API || `http://api.sandbox.stardust.com/${v}`,
    timeout: 25000,
    headers: {'Content-Type': 'application/json'}
});

interface RoutesObj {
    setters: { [key1: string]: { [key2: string]: { [key3: string]: string [] } }; };
    getters: { [key1: string]: { [key2: string]: string [] }; };
}

const routesObj: RoutesObj = {
    getters: {
        asset: {
            getAll: ['/assets'],
            getAssetsOf: ['/assetsOf'],
            getDetails: ['/assets']
        },
        box: {
            getAll: ['/boxes'],
            getDetails: ['/boxes']
        },
        game: {
            getAll: ['/games'],
            getBalanceOf: ['/games'],
            getDetails: ['/games']
        },
        loan: {
            getCreatedCount: ['/loans/created-loans-count'],
            getDeletedCount: ['/loans/deleted-loans-count'],
            getFreeBalanceOf: ['/loans/free-balance-of'],
            getLoanedBalanceOf: ['/loans/loaned-balance-of'],
            getSpecific: ['/loans']
        },
        shop: {
            getOrderCount: ['/shop/order-count'],
            getSpecific: ['/shop/orders'],
            getUserOrder: ['/shop/game-orders'],
            getUserOrderCountInGame: ['/shop/orders/count'],
            getUserOrders: ['/shop/game-orders']
        },
        trade: {
            getClosedCount: ['/trades/closed-count'],
            getOpenCount: ['/trades/open-count'],
            getTrade: ['/trades'],
            getUserTradeInGame: ['/trades/game'],
            getUserTradeCountDetails: ['/trades/user-count'],
            getUserTradeIdsInGame: ['/trades/game/id']
        }
    },
    setters: {
        asset: {
            add: {routes: ['/assets'], paramKeys: ['gameAddr']},
            mint: {routes: ['/assets/mint'], paramKeys: ['gameAddr', 'assetId']},
            trade: {routes: ['/assets/trade'], paramKeys: ['gameAddr', 'assetId']}
        },
        box: {
            add: {routes: ['/boxes'], paramKeys: ['gameAddr']},
            buy: {routes: ['/boxes/buy'], paramKeys: ['gameAddr', 'boxId']},
            remove: {routes: ['/boxes/delete'], paramKeys: ['gameAddr', 'boxId']},
            update: {routes: ['/boxes/update'], paramKeys: ['gameAddr', 'boxId']}
        },
        game: {
            deploy: {routes: ['/games'], paramKeys: ['']},
            transfer: {routes: ['/games/transfer'], paramKeys: ['gameAddr']}
        },
        loan: {
            finish: {routes: ['/loans/finish'], paramKeys: ['gameAddr', 'loanId']},
            handlePrivate: {routes: ['/loans/handle-private'], paramKeys: ['gameAddr', 'loanId']},
            handlePublic: {routes: ['/loans/handle-public'], paramKeys: ['gameAddr', 'loanId']},
            offerPrivate: {routes: ['/loans/offer-private'], paramKeys: ['gameAddr', 'assetId']},
            offerPublic: {routes: ['/loans/offer-public'], paramKeys: ['gameAddr', 'assetId']}
        },
        shop: {
            cashToToken: {routes: ['/shop/cash-to-token'], paramKeys: ['gameAddr']},
            tokenToCash: {routes: ['/shop/token-to-cash'], paramKeys: ['gameAddr']},
            tokenToToken: {routes: ['/shop/token-to-token'], paramKeys: ['gameAddr']}
        },
        trade: {
            offerPrivate: {routes: ['/trades/offer-private'], paramKeys: ['gameAddr']},
            offerPublic: {routes: ['/trades/offer-public'], paramKeys: ['gameAddr']},
            remove: {routes: ['/trades/remove'], paramKeys: ['gameAddr', 'index']},
            takePrivate: {routes: ['/trades/take-private'], paramKeys: ['gameAddr', 'index']},
            takePublic: {routes: ['/trades/take-public'], paramKeys: ['gameAddr', 'index']}
        }
    }
};

const pluck = <T, K extends keyof T>(obj: T, names: K[]) => fromPairs(Object.entries(obj).filter(([key]) => names.includes(key as K))) as Pick<T, K>;
const paths = <T>(obj: {[key1: string]: {[key2: string]: T}}) => Object.entries(obj).map(([key1, val]) => Object.keys(val).map((key2) => ({key1, key2}))).reduce((prev, curr) => [...prev, ...curr], []);
const pathsMap = <T, U>(obj: {[key1: string]: {[key2: string]: T}}, f: (a: string, b: string) => U) => paths(obj).map(({key1, key2}) => ({key1, key2, func: f(key1, key2)})) as Array<{key1: keyof U; key2: string; func: U}>;

const createPost = <T>(key1: string, key2: string) => async(data: T, privKey: string) => {
    const {routes, paramKeys} = routesObj.setters[key1][key2] as {routes: string[]; paramKeys: Array<keyof T>};
    const postJSON = (createPostJSON as { [key1: string]: { [key2: string]: any }; })[key1][key2] as postJSONFunc<T>;
    return wrapper.post(routes[0], postJSON(data, privKey), {params: pluck(data, paramKeys)});
};

const createGet = <U>(key1: string, key2: string) => async(params: U) => wrapper.get(routesObj.getters[key1][key2][0], {params});

const combine = <U>() => <T>(pathsMapped: Array<{key1: keyof U; key2: string; func: T}>) => pathsMapped.reduce((prev, {key1, key2, func}) => {
    return Object.assign({}, prev, {[key1] : {...(((key1 in prev) ? prev[key1] : {}) as object), [key2]: func}});
}, {} as U);

const getters = combine<Wrapper.GetterMap>()(pathsMap(routesObj.getters, createGet));
const setters = combine<Wrapper.SetterMap>()(pathsMap(routesObj.setters, createPost));
export const stardustAPI = {setters, getters};
