
/*************************************************************\
 *                                                           *
 *        THIS FILE WAS AUTOMATICALLY GENERATED              *
 *      ANY CHANGES TO THIS FILE WILL BE REVERTED            *
 *                                                           *
\*************************************************************/
import {Wrapper} from './types/stardust';

import {sign} from './stardust';

import {hash} from './hash';

export const hashAndSign: Wrapper.HashAndSignObjType = {
    token: {
        add: (data, privKey) => sign(hash.token.add(data), privKey),
        mint: (data, privKey) => sign(hash.token.mint(data), privKey),
        transfer: (data, privKey) => sign(hash.token.transfer(data), privKey),
        burn: (data, privKey) => sign(hash.token.burn(data), privKey)
    },
    box: {
        add: (data, privKey) => sign(hash.box.add(data), privKey),
        buy: (data, privKey) => sign(hash.box.buy(data), privKey),
        remove: (data, privKey) => sign(hash.box.remove(data), privKey),
        update: (data, privKey) => sign(hash.box.update(data), privKey)
    },
    game: {
        deploy: (data, privKey) => sign(hash.game.deploy(data), privKey),
        transfer: (data, privKey) => sign(hash.game.transfer(data), privKey)
    },
    loan: {
        finish: (data, privKey) => sign(hash.loan.finish(data), privKey),
        handlePrivate: (data, privKey) => sign(hash.loan.handlePrivate(data), privKey),
        handlePublic: (data, privKey) => sign(hash.loan.handlePublic(data), privKey),
        offerPrivate: (data, privKey) => sign(hash.loan.offerPrivate(data), privKey),
        offerPublic: (data, privKey) => sign(hash.loan.offerPublic(data), privKey)
    },
    shop: {
        cashToToken: (data, privKey) => sign(hash.shop.cashToToken(data), privKey),
        tokenToCash: (data, privKey) => sign(hash.shop.tokenToCash(data), privKey),
        tokenToToken: (data, privKey) => sign(hash.shop.tokenToToken(data), privKey)
    },
    trade: {
        offerPrivate: (data, privKey) => sign(hash.trade.offerPrivate(data), privKey),
        offerPublic: (data, privKey) => sign(hash.trade.offerPublic(data), privKey),
        remove: (data, privKey) => sign(hash.trade.remove(data), privKey),
        takePrivate: (data, privKey) => sign(hash.trade.takePrivate(data), privKey),
        takePublic: (data, privKey) => sign(hash.trade.takePublic(data), privKey)
    },
    user: {
        generate: (data, privKey) => sign(hash.user.generate(data), privKey)
    }
};
