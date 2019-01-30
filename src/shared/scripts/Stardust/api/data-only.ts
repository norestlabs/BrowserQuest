
/*************************************************************\
 *                                                           *
 *        THIS FILE WAS AUTOMATICALLY GENERATED              *
 *      ANY CHANGES TO THIS FILE WILL BE REVERTED            *
 *                                                           *
\*************************************************************/
import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {Wrapper} from '../types/stardust';

import {pick} from 'ramda';

import {createPostJSON} from '../postJSON';

const v = 'v1';
const wrapper = (baseURL = `http://api.sandbox.stardust.com/${v}`) => axios.create({
    baseURL,
    timeout: 25000,
    headers: {'Content-Type': 'application/json'}
});

const dataOnly = (res: AxiosResponse) => res.data;
const makeSetters = (wrapperIn: AxiosInstance): Wrapper.SetterMap => ({
    token: {
        add: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens', createPostJSON.token.add(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        mint: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/mint', createPostJSON.token.mint(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        transfer: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/transfer', createPostJSON.token.transfer(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        burn: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/burn', createPostJSON.token.burn(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    box: {
        add: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes', createPostJSON.box.add(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        buy: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/buy', createPostJSON.box.buy(data, privKey), {params: pick(['gameAddr', 'boxId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        remove: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/delete', createPostJSON.box.remove(data, privKey), {params: pick(['gameAddr', 'boxId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        update: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/update', createPostJSON.box.update(data, privKey), {params: pick(['gameAddr', 'boxId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    game: {
        deploy: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/games', createPostJSON.game.deploy(data, privKey), {params: pick([], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        transfer: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/games/transfer', createPostJSON.game.transfer(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    loan: {
        finish: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/finish', createPostJSON.loan.finish(data, privKey), {params: pick(['gameAddr', 'loanId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        handlePrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/handle-private', createPostJSON.loan.handlePrivate(data, privKey), {params: pick(['gameAddr', 'loanId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        handlePublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/handle-public', createPostJSON.loan.handlePublic(data, privKey), {params: pick(['gameAddr', 'loanId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        offerPrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/offer-private', createPostJSON.loan.offerPrivate(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        offerPublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/offer-public', createPostJSON.loan.offerPublic(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    shop: {
        cashToToken: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/cash-to-token', createPostJSON.shop.cashToToken(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        tokenToCash: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/token-to-cash', createPostJSON.shop.tokenToCash(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        tokenToToken: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/token-to-token', createPostJSON.shop.tokenToToken(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    trade: {
        offerPrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/offer-private', createPostJSON.trade.offerPrivate(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        offerPublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/offer-public', createPostJSON.trade.offerPublic(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        remove: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/remove', createPostJSON.trade.remove(data, privKey), {params: pick(['gameAddr', 'index'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        takePrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/take-private', createPostJSON.trade.takePrivate(data, privKey), {params: pick(['gameAddr', 'index'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        },
        takePublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/take-public', createPostJSON.trade.takePublic(data, privKey), {params: pick(['gameAddr', 'index'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    },
    user: {
        generate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/user/generate', createPostJSON.user.generate(data, privKey), {params: pick(['gameAddr'], data)}).then(dataOnly);
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.txId}&blocking=true`).then(dataOnly);
        }
    }
});
const makeGetters = (wrapperIn: AxiosInstance): Wrapper.GetterMap => ({
    token: {
        getAllTokensOf: async(params) => wrapperIn.get('/allTokensOf', {params}).then(dataOnly),
        getTokensOf: async(params) => wrapperIn.get('/tokensOf', {params}).then(dataOnly),
        getDetails: async(params) => wrapperIn.get('/tokens', {params}).then(dataOnly),
        getAll: async(params) => wrapperIn.get('/tokens', {params}).then(dataOnly),
        getOne: async(params) => wrapperIn.get('/tokens', {params}).then(dataOnly)
    },
    box: {
        getDetails: async(params) => wrapperIn.get('/boxes', {params}).then(dataOnly),
        getAll: async(params) => wrapperIn.get('/boxes', {params}).then(dataOnly),
        getOne: async(params) => wrapperIn.get('/boxes', {params}).then(dataOnly)
    },
    game: {
        getBalanceOf: async(params) => wrapperIn.get('/games/balance', {params}).then(dataOnly),
        getDetails: async(params) => wrapperIn.get('/games', {params}).then(dataOnly),
        getAll: async(params) => wrapperIn.get('/games', {params}).then(dataOnly),
        getOne: async(params) => wrapperIn.get('/games', {params}).then(dataOnly)
    },
    loan: {
        getCreatedCount: async(params) => wrapperIn.get('/loans/created-loans-count', {params}).then(dataOnly),
        getDeletedCount: async(params) => wrapperIn.get('/loans/deleted-loans-count', {params}).then(dataOnly),
        getFreeBalanceOf: async(params) => wrapperIn.get('/loans/free-balance-of', {params}).then(dataOnly),
        getLoanedBalanceOf: async(params) => wrapperIn.get('/loans/loaned-balance-of', {params}).then(dataOnly),
        getSpecific: async(params) => wrapperIn.get('/loans', {params}).then(dataOnly)
    },
    shop: {
        getOrderCount: async(params) => wrapperIn.get('/shop/order-count', {params}).then(dataOnly),
        getUserOrderCount: async(params) => wrapperIn.get('/shop/user-order-count', {params}).then(dataOnly),
        getSpecific: async(params) => wrapperIn.get('/shop/orders', {params}).then(dataOnly),
        getUserOrderCountInGame: async(params) => wrapperIn.get('/shop/orders/count', {params}).then(dataOnly),
        getUserOrderDetails: async(params) => wrapperIn.get('/shop/game-orders', {params}).then(dataOnly),
        getAllUserOrders: async(params) => wrapperIn.get('/shop/game-orders', {params}).then(dataOnly),
        getOneUserOrder: async(params) => wrapperIn.get('/shop/game-orders', {params}).then(dataOnly)
    },
    trade: {
        getAll: async(params) => wrapperIn.get('/trades', {params}).then(dataOnly),
        getGameClosedCount: async(params) => wrapperIn.get('/trades/game/closed-count', {params}).then(dataOnly),
        getGameDetails: async(params) => wrapperIn.get('/trades/game', {params}).then(dataOnly),
        getGameTrade: async(params) => wrapperIn.get('/trades/game', {params}).then(dataOnly),
        getGameTrades: async(params) => wrapperIn.get('/trades/game', {params}).then(dataOnly),
        getGameOpenCount: async(params) => wrapperIn.get('/trades/game/open-count', {params}).then(dataOnly),
        getUserTradeCountDetails: async(params) => wrapperIn.get('/trades/game/user/count', {params}).then(dataOnly),
        getUserTradeCount: async(params) => wrapperIn.get('/trades/game/user/count', {params}).then(dataOnly),
        getUserTradeCountInGame: async(params) => wrapperIn.get('/trades/game/user/count', {params}).then(dataOnly),
        getUserTradeIds: async(params) => wrapperIn.get('/trades/user/all-trade-ids', {params}).then(dataOnly),
        getUserTradeIdsInGame: async(params) => wrapperIn.get('/trades/game/user/all-trade-ids', {params}).then(dataOnly),
        getUserTradeInGame: async(params) => wrapperIn.get('/trades/game/user/id', {params}).then(dataOnly),
        getUserTrades: async(params) => wrapperIn.get('/trades/user', {params}).then(dataOnly),
        getUserTradesInGame: async(params) => wrapperIn.get('/trades/game/user', {params}).then(dataOnly)
    },
    tx: {
        getStatus: async(params) => wrapperIn.get('/tx/status', {params}).then(dataOnly),
        getData: async(params) => wrapperIn.get('/tx/return-data', {params}).then(dataOnly)
    }
});
export const stardustAPI = (baseURL: string) => {
    const wrapperIn = wrapper(baseURL);
    const getters = makeGetters(wrapperIn);
    const setters = makeSetters(wrapperIn);
    return {setters, getters};
};
