
/*************************************************************\
 *                                                           *
 *        THIS FILE WAS AUTOMATICALLY GENERATED              *
 *      ANY CHANGES TO THIS FILE WILL BE REVERTED            *
 *                                                           *
\*************************************************************/

import axios, {AxiosInstance} from 'axios';
import {Wrapper} from '../types/stardust';

import {pick} from 'ramda';

import {createPostJSON} from '../postJSON';

const v = 'v1';
const wrapper = (baseURL = `http://api.sandbox.stardust.com/${v}`) => axios.create({
    baseURL,
    timeout: 25000,
    headers: {'Content-Type': 'application/json'}
});

const makeSetters = (wrapperIn: AxiosInstance): Wrapper.SetterMap => ({
    token: {
        add: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens', createPostJSON.token.add(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        mint: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/mint', createPostJSON.token.mint(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        transfer: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/transfer', createPostJSON.token.transfer(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        burn: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/tokens/burn', createPostJSON.token.burn(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    box: {
        add: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes', createPostJSON.box.add(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        buy: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/buy', createPostJSON.box.buy(data, privKey), {params: pick(['gameAddr', 'boxId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        remove: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/delete', createPostJSON.box.remove(data, privKey), {params: pick(['gameAddr', 'boxId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        update: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/boxes/update', createPostJSON.box.update(data, privKey), {params: pick(['gameAddr', 'boxId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    game: {
        deploy: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/games', createPostJSON.game.deploy(data, privKey), {params: pick([], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        transfer: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/games/transfer', createPostJSON.game.transfer(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    loan: {
        finish: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/finish', createPostJSON.loan.finish(data, privKey), {params: pick(['gameAddr', 'loanId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        handlePrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/handle-private', createPostJSON.loan.handlePrivate(data, privKey), {params: pick(['gameAddr', 'loanId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        handlePublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/handle-public', createPostJSON.loan.handlePublic(data, privKey), {params: pick(['gameAddr', 'loanId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        offerPrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/offer-private', createPostJSON.loan.offerPrivate(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        offerPublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/loans/offer-public', createPostJSON.loan.offerPublic(data, privKey), {params: pick(['gameAddr', 'tokenId'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    shop: {
        cashToToken: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/cash-to-token', createPostJSON.shop.cashToToken(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        tokenToCash: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/token-to-cash', createPostJSON.shop.tokenToCash(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        tokenToToken: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/shop/token-to-token', createPostJSON.shop.tokenToToken(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    trade: {
        offerPrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/offer-private', createPostJSON.trade.offerPrivate(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        offerPublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/offer-public', createPostJSON.trade.offerPublic(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        remove: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/remove', createPostJSON.trade.remove(data, privKey), {params: pick(['gameAddr', 'index'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        takePrivate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/take-private', createPostJSON.trade.takePrivate(data, privKey), {params: pick(['gameAddr', 'index'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        },
        takePublic: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/trades/take-public', createPostJSON.trade.takePublic(data, privKey), {params: pick(['gameAddr', 'index'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    },
    user: {
        generate: async(data, privKey) => {
            const returnVal = await wrapperIn.post('/user/generate', createPostJSON.user.generate(data, privKey), {params: pick(['gameAddr'], data)});
            return wrapperIn.get(`/tx/return-data?txId=${returnVal.data.txId}&blocking=true`);
        }
    }
});
const makeGetters = (wrapperIn: AxiosInstance): Wrapper.GetterMap => ({
    token: {
        getAllTokensOf: async(params) => wrapperIn.get('/allTokensOf', {params}),
        getTokensOf: async(params) => wrapperIn.get('/tokensOf', {params}),
        getDetails: async(params) => wrapperIn.get('/tokens', {params}),
        getAll: async(params) => wrapperIn.get('/tokens', {params}),
        getOne: async(params) => wrapperIn.get('/tokens', {params})
    },
    box: {
        getDetails: async(params) => wrapperIn.get('/boxes', {params}),
        getAll: async(params) => wrapperIn.get('/boxes', {params}),
        getOne: async(params) => wrapperIn.get('/boxes', {params})
    },
    game: {
        getBalanceOf: async(params) => wrapperIn.get('/games/balance', {params}),
        getDetails: async(params) => wrapperIn.get('/games', {params}),
        getAll: async(params) => wrapperIn.get('/games', {params}),
        getOne: async(params) => wrapperIn.get('/games', {params})
    },
    loan: {
        getCreatedCount: async(params) => wrapperIn.get('/loans/created-loans-count', {params}),
        getDeletedCount: async(params) => wrapperIn.get('/loans/deleted-loans-count', {params}),
        getFreeBalanceOf: async(params) => wrapperIn.get('/loans/free-balance-of', {params}),
        getLoanedBalanceOf: async(params) => wrapperIn.get('/loans/loaned-balance-of', {params}),
        getSpecific: async(params) => wrapperIn.get('/loans', {params})
    },
    shop: {
        getOrderCount: async(params) => wrapperIn.get('/shop/order-count', {params}),
        getUserOrderCount: async(params) => wrapperIn.get('/shop/user-order-count', {params}),
        getSpecific: async(params) => wrapperIn.get('/shop/orders', {params}),
        getUserOrderCountInGame: async(params) => wrapperIn.get('/shop/orders/count', {params}),
        getUserOrderDetails: async(params) => wrapperIn.get('/shop/game-orders', {params}),
        getAllUserOrders: async(params) => wrapperIn.get('/shop/game-orders', {params}),
        getOneUserOrder: async(params) => wrapperIn.get('/shop/game-orders', {params})
    },
    trade: {
        getAll: async(params) => wrapperIn.get('/trades', {params}),
        getGameClosedCount: async(params) => wrapperIn.get('/trades/game/closed-count', {params}),
        getGameDetails: async(params) => wrapperIn.get('/trades/game', {params}),
        getGameTrade: async(params) => wrapperIn.get('/trades/game', {params}),
        getGameTrades: async(params) => wrapperIn.get('/trades/game', {params}),
        getGameOpenCount: async(params) => wrapperIn.get('/trades/game/open-count', {params}),
        getUserTradeCountDetails: async(params) => wrapperIn.get('/trades/game/user/count', {params}),
        getUserTradeCount: async(params) => wrapperIn.get('/trades/game/user/count', {params}),
        getUserTradeCountInGame: async(params) => wrapperIn.get('/trades/game/user/count', {params}),
        getUserTradeIds: async(params) => wrapperIn.get('/trades/user/all-trade-ids', {params}),
        getUserTradeIdsInGame: async(params) => wrapperIn.get('/trades/game/user/all-trade-ids', {params}),
        getUserTradeInGame: async(params) => wrapperIn.get('/trades/game/user/id', {params}),
        getUserTrades: async(params) => wrapperIn.get('/trades/user', {params}),
        getUserTradesInGame: async(params) => wrapperIn.get('/trades/game/user', {params})
    },
    tx: {
        getStatus: async(params) => wrapperIn.get('/tx/status', {params}),
        getData: async(params) => wrapperIn.get('/tx/return-data', {params})
    }
});
export const stardustAPI = (baseURL: string) => {
    const wrapperIn = wrapper(baseURL);
    const getters = makeGetters(wrapperIn);
    const setters = makeSetters(wrapperIn);
    return {setters, getters};
};
