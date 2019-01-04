'use strict';
 
const Web3 = require('web3');
const web3 = new Web3();
 
const{'utils': {soliditySha3}, 'eth': {abi, accounts}} = web3;
 
// CREATE WALLET FUNCTIONS
const createWallet = () => {
    const acc = web3.eth.accounts.create();
    const _privateKey = acc.privateKey;
    return[acc.address, _privateKey];
};
 
// GENERIC FUNCTIONS
const hashParam = (value, type) => soliditySha3(abi.encodeParameter(type, value));
const hashParams = (values, types) => values.map((value, index) => hashParam(value, types[index]));
 
// CREATE_GAME FUNCTIONS
const hashGame = (gameData) => {
    const{name, symbol, desc, image, owner, nonce} = gameData;
    const gameParamTypes = ['string', 'string', 'string', 'string', 'address', 'uint256'];
    const hashes = hashParams([name, symbol, desc, image, owner, nonce], gameParamTypes);
    return(hashParam(hashes, 'bytes32[]'));
};
 
const hashAndSignGame = (gameData, privKey) => {
    const sig = accounts.sign(hashGame(gameData), privKey);
    return({'signedMessage': sig.signature + sig.message.slice(2)});
};
 
const createGamePostJSON = (gameData, privKey) => ({...gameData, ...hashAndSignGame(gameData, privKey)});
 
// CREATE_ASSET FUNCTIONS
const hashAsset = ({name, desc, image, rarity, cap, val, gameAddr, nonce}) => {
    const assetParamTypes = ['string', 'string', 'string', 'uint256', 'uint256', 'uint256', 'address', 'uint256'];
    const hashes = hashParams([name, desc, image, rarity, cap, val, gameAddr, nonce], assetParamTypes);
    return(hashParam(hashes, 'bytes32[]'));
};
 
const hashAndSignAsset = (assetData, privKey) => {
    const sig = accounts.sign(hashAsset(assetData), privKey);
    return({'signedMessage': sig.signature + sig.message.slice(2)});
};
 
const createAssetPostJSON = (assetData, privKey) => ({...assetData, ...hashAndSignAsset(assetData, privKey)});
 
// MINTING
const hashAssetMint = ({to, assetId, amount, gameAddr, nonce}) => {
    const mintParamTypes = ['address', 'uint256', 'uint256', 'address', 'uint256'];
    const hashes = hashParams([to, assetId, amount, gameAddr, nonce], mintParamTypes);
    return(hashParam(hashes, 'bytes32[]'));
};
 
const hashAndSignMint = (assetData, privKey) => {
    const sig = accounts.sign(hashAssetMint(assetData), privKey);
    return({'signedMessage': sig.signature + sig.message.slice(2)});
};
 
const createAssetMintPostJSON = (assetData, privKey) => ({...assetData, ...hashAndSignMint(assetData, privKey)});
 
// TRADE ASSETS
const hashAssetTrade = ({to, amount, nonce, assetId}) => {
    const tradeParamTypes = ['address', 'uint256', 'uint256', 'uint256'];
    const hashes = hashParams([to, amount, nonce, assetId], tradeParamTypes);
    return(hashParam(hashes, 'bytes32[]'));
};
 
const hashAndSignTrade = (tradeData, privKey) => {
    const sig = accounts.sign(hashAssetTrade(tradeData), privKey);
    return({'signedMessage': sig.signature + sig.message.slice(2)});
};
 
const createAssetTradePostJSON = (tradeData, privKey) => ({...tradeData, ...hashAndSignTrade(tradeData, privKey)});
 
/* eslint-disable */
// ? exports.hashParam = hashParam;
// ? exports.hashParams = hashParams;
/* eslint-enable */
exports.createWallet = createWallet;
exports.hashGame = hashGame;
exports.hashAndSignGame = hashAndSignGame;
exports.createGamePostJSON = createGamePostJSON;
exports.hashAsset = hashAsset;
exports.hashAndSignAsset = hashAndSignAsset;
exports.createAssetPostJSON = createAssetPostJSON;
exports.hashAssetMint = hashAssetMint;
exports.hashAndSignMint = hashAndSignMint;
exports.createAssetMintPostJSON = createAssetMintPostJSON;
exports.hashAssetTrade = hashAssetTrade;
exports.hashAndSignTrade = hashAndSignTrade;
exports.createAssetTradePostJSON = createAssetTradePostJSON;
