
/*************************************************************\
 *                                                           *
 *        THIS FILE WAS AUTOMATICALLY GENERATED              *
 *      ANY CHANGES TO THIS FILE WILL BE REVERTED            *
 *                                                           *
\*************************************************************/
import {Wrapper} from './types/stardust';

import {hashAndSign} from './hashAndSign';

export const createPostJSON: Wrapper.PostJSONObjType = {
    token: {
        add: (data, privKey) => ({...data, signedMessage: hashAndSign.token.add(data, privKey)}),
        mint: (data, privKey) => ({...data, signedMessage: hashAndSign.token.mint(data, privKey)}),
        transfer: (data, privKey) => ({...data, signedMessage: hashAndSign.token.transfer(data, privKey)}),
        burn: (data, privKey) => ({...data, signedMessage: hashAndSign.token.burn(data, privKey)})
    },
    box: {
        add: (data, privKey) => ({...data, signedMessage: hashAndSign.box.add(data, privKey)}),
        buy: (data, privKey) => ({...data, signedMessage: hashAndSign.box.buy(data, privKey)}),
        remove: (data, privKey) => ({...data, signedMessage: hashAndSign.box.remove(data, privKey)}),
        update: (data, privKey) => ({...data, signedMessage: hashAndSign.box.update(data, privKey)})
    },
    game: {
        deploy: (data, privKey) => ({...data, signedMessage: hashAndSign.game.deploy(data, privKey)}),
        transfer: (data, privKey) => ({...data, signedMessage: hashAndSign.game.transfer(data, privKey)})
    },
    loan: {
        finish: (data, privKey) => ({...data, signedMessage: hashAndSign.loan.finish(data, privKey)}),
        handlePrivate: (data, privKey) => ({...data, signedMessage: hashAndSign.loan.handlePrivate(data, privKey)}),
        handlePublic: (data, privKey) => ({...data, signedMessage: hashAndSign.loan.handlePublic(data, privKey)}),
        offerPrivate: (data, privKey) => ({...data, signedMessage: hashAndSign.loan.offerPrivate(data, privKey)}),
        offerPublic: (data, privKey) => ({...data, signedMessage: hashAndSign.loan.offerPublic(data, privKey)})
    },
    shop: {
        cashToToken: (data, privKey) => ({...data, signedMessage: hashAndSign.shop.cashToToken(data, privKey)}),
        tokenToCash: (data, privKey) => ({...data, signedMessage: hashAndSign.shop.tokenToCash(data, privKey)}),
        tokenToToken: (data, privKey) => ({...data, signedMessage: hashAndSign.shop.tokenToToken(data, privKey)})
    },
    trade: {
        offerPrivate: (data, privKey) => ({...data, signedMessage: hashAndSign.trade.offerPrivate(data, privKey)}),
        offerPublic: (data, privKey) => ({...data, signedMessage: hashAndSign.trade.offerPublic(data, privKey)}),
        remove: (data, privKey) => ({...data, signedMessage: hashAndSign.trade.remove(data, privKey)}),
        takePrivate: (data, privKey) => ({...data, signedMessage: hashAndSign.trade.takePrivate(data, privKey)}),
        takePublic: (data, privKey) => ({...data, signedMessage: hashAndSign.trade.takePublic(data, privKey)})
    },
    user: {
        generate: (data, privKey) => ({...data, signedMessage: hashAndSign.user.generate(data, privKey)})
    }
};
