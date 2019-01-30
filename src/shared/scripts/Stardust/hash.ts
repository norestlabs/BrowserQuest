
/*************************************************************\
 *                                                           *
 *        THIS FILE WAS AUTOMATICALLY GENERATED              *
 *      ANY CHANGES TO THIS FILE WILL BE REVERTED            *
 *                                                           *
\*************************************************************/
import {BigNumber} from 'bignumber.js';

import {hashParam} from './stardust';
import {solidityParam, solidityValue, Wrapper} from './types/stardust';

const hashParams = (values: solidityValue[], types: solidityParam[]) => values.map((value, index) => hashParam(value, types[index]));

const combineHashes = (hashes: ReadonlyArray<string>) => hashParam(hashes, 'bytes32[]');

const scaleUp = (rarityPercs: ReadonlyArray<number>) => {
    const smallestFraction = Math.max(...rarityPercs.map((z) => new BigNumber(z).decimalPlaces()));
    const scaleFactor = new BigNumber(10).pow(smallestFraction);
    const scaledUp = rarityPercs.map((z) => new BigNumber(z).multipliedBy(scaleFactor)).map(Number);
    return scaledUp;
};
export const hashParamTypes: Wrapper.SetterOf<solidityParam[]> = {
    token: {
        add: ['address', 'string', 'uint256', 'uint256', 'uint256', 'string', 'string', 'uint256'],
        mint: ['address', 'uint256', 'address', 'uint256', 'uint256'],
        transfer: ['address', 'uint256', 'address', 'address', 'uint256', 'uint256'],
        burn: ['address', 'uint256', 'address', 'uint256', 'uint256']
    },
    box: {
        add: ['address', 'string', 'string', 'string', 'uint256[]', 'uint256'],
        buy: ['address', 'uint256', 'uint256'],
        remove: ['address', 'uint256', 'uint256'],
        update: ['address', 'uint256', 'bool', 'string', 'string', 'string', 'uint256[]', 'uint256']
    },
    game: {
        deploy: ['address', 'string', 'string', 'string', 'string', 'uint256[]', 'uint256'],
        transfer: ['address', 'address', 'address', 'uint256']
    },
    loan: {
        finish: ['address', 'uint256', 'uint256'],
        handlePrivate: ['address', 'uint256', 'bool', 'uint256'],
        handlePublic: ['address', 'uint256', 'uint256'],
        offerPrivate: ['address', 'address', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
        offerPublic: ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256']
    },
    shop: {
        cashToToken: ['address', 'uint256', 'uint256', 'uint256'],
        tokenToCash: ['address', 'uint256', 'uint256', 'uint256'],
        tokenToToken: ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256']
    },
    trade: {
        offerPrivate: ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
        offerPublic: ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
        remove: ['address', 'uint256', 'uint256'],
        takePrivate: ['address', 'uint256', 'uint256'],
        takePublic: ['address', 'uint256', 'uint256']
    },
    user: {
        generate: ['address']
    }
};
export const hash: Wrapper.HashObjType = {
    token: {
        add: ({gameAddr, name, rarity, cap, val, desc, image, timestamp}) => {
            const valueArr = [gameAddr, name, rarity, cap, val, desc, image, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.token.add);
            return combineHashes(hashes);
        },
        mint: ({gameAddr, tokenId, to, amount, timestamp}) => {
            const valueArr = [gameAddr, tokenId, to, amount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.token.mint);
            return combineHashes(hashes);
        },
        transfer: ({gameAddr, tokenId, from, to, amount, timestamp}) => {
            const valueArr = [gameAddr, tokenId, from, to, amount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.token.transfer);
            return combineHashes(hashes);
        },
        burn: ({gameAddr, tokenId, from, amount, timestamp}) => {
            const valueArr = [gameAddr, tokenId, from, amount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.token.burn);
            return combineHashes(hashes);
        }
    },
    box: {
        add: ({gameAddr, name, desc, image, tokens, timestamp}) => {
            const valueArr = [gameAddr, name, desc, image, tokens, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.box.add);
            return combineHashes(hashes);
        },
        buy: ({gameAddr, boxId, timestamp}) => {
            const valueArr = [gameAddr, boxId, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.box.buy);
            return combineHashes(hashes);
        },
        remove: ({gameAddr, boxId, timestamp}) => {
            const valueArr = [gameAddr, boxId, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.box.remove);
            return combineHashes(hashes);
        },
        update: ({gameAddr, boxId, isValid, name, desc, image, tokens, timestamp}) => {
            const valueArr = [gameAddr, boxId, isValid, name, desc, image, tokens, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.box.update);
            return combineHashes(hashes);
        }
    },
    game: {
        deploy: ({owner, name, symbol, desc, image, rarityPercs, timestamp}) => {
            const valueArr = [owner, name, symbol, desc, image, scaleUp(rarityPercs), timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.game.deploy);
            return combineHashes(hashes);
        },
        transfer: ({gameAddr, from, to, timestamp}) => {
            const valueArr = [gameAddr, from, to, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.game.transfer);
            return combineHashes(hashes);
        }
    },
    loan: {
        finish: ({gameAddr, loanId, timestamp}) => {
            const valueArr = [gameAddr, loanId, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.loan.finish);
            return combineHashes(hashes);
        },
        handlePrivate: ({gameAddr, loanId, decision, timestamp}) => {
            const valueArr = [gameAddr, loanId, decision, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.loan.handlePrivate);
            return combineHashes(hashes);
        },
        handlePublic: ({gameAddr, loanId, timestamp}) => {
            const valueArr = [gameAddr, loanId, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.loan.handlePublic);
            return combineHashes(hashes);
        },
        offerPrivate: ({gameAddr, lender, borrower, tokenId, amount, length, timestamp}) => {
            const valueArr = [gameAddr, lender, borrower, tokenId, amount, length, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.loan.offerPrivate);
            return combineHashes(hashes);
        },
        offerPublic: ({gameAddr, lender, tokenId, amount, length, timestamp}) => {
            const valueArr = [gameAddr, lender, tokenId, amount, length, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.loan.offerPublic);
            return combineHashes(hashes);
        }
    },
    shop: {
        cashToToken: ({gameAddr, tokenId, amount, timestamp}) => {
            const valueArr = [gameAddr, tokenId, amount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.shop.cashToToken);
            return combineHashes(hashes);
        },
        tokenToCash: ({gameAddr, tokenId, amount, timestamp}) => {
            const valueArr = [gameAddr, tokenId, amount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.shop.tokenToCash);
            return combineHashes(hashes);
        },
        tokenToToken: ({gameAddr, fromId, fromAmount, toId, toAmount, timestamp}) => {
            const valueArr = [gameAddr, fromId, fromAmount, toId, toAmount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.shop.tokenToToken);
            return combineHashes(hashes);
        }
    },
    trade: {
        offerPrivate: ({gameAddr, taker, offeredId, offeredAmount, wantedId, wantedAmount, timestamp}) => {
            const valueArr = [gameAddr, taker, offeredId, offeredAmount, wantedId, wantedAmount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.trade.offerPrivate);
            return combineHashes(hashes);
        },
        offerPublic: ({gameAddr, offeredId, offeredAmount, wantedId, wantedAmount, timestamp}) => {
            const valueArr = [gameAddr, offeredId, offeredAmount, wantedId, wantedAmount, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.trade.offerPublic);
            return combineHashes(hashes);
        },
        remove: ({gameAddr, index, timestamp}) => {
            const valueArr = [gameAddr, index, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.trade.remove);
            return combineHashes(hashes);
        },
        takePrivate: ({gameAddr, index, timestamp}) => {
            const valueArr = [gameAddr, index, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.trade.takePrivate);
            return combineHashes(hashes);
        },
        takePublic: ({gameAddr, index, timestamp}) => {
            const valueArr = [gameAddr, index, timestamp];
            const hashes = hashParams(valueArr, hashParamTypes.trade.takePublic);
            return combineHashes(hashes);
        }
    },
    user: {
        generate: ({gameAddr}) => {
            const valueArr = [gameAddr];
            const hashes = hashParams(valueArr, hashParamTypes.user.generate);
            return combineHashes(hashes);
        }
    }
};
