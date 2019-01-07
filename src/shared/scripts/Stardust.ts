'use strict';

const Web3 = require('web3');
const web3 = new Web3();

const { 'utils': { soliditySha3 }, 'eth': { abi, accounts } } = web3;

// CREATE WALLET FUNCTIONS
export const createWallet = () => {
  const acc = web3.eth.accounts.create();
  const _privateKey = acc.privateKey;
  return [acc.address, _privateKey];
};

// GENERIC FUNCTIONS
export const hashParam = (value: any, type: any) => soliditySha3(abi.encodeParameter(type, value));
export const hashParams = (values: any, types: any) => values.map((value: any, index: any) => hashParam(value, types[index]));

// CREATE_GAME FUNCTIONS
export const hashGame = (gameData: any) => {
  const { name, symbol, desc, image, owner, nonce } = gameData;
  const gameParamTypes = ['string', 'string', 'string', 'string', 'address', 'uint256'];
  const hashes = hashParams([name, symbol, desc, image, owner, nonce], gameParamTypes);
  return (hashParam(hashes, 'bytes32[]'));
};

export const hashAndSignGame = (gameData: any, privKey: any) => {
  const sig = accounts.sign(hashGame(gameData), privKey);
  return ({ 'signedMessage': sig.signature + sig.message.slice(2) });
};

export const createGamePostJSON = (gameData: any, privKey: any) => ({ ...gameData, ...hashAndSignGame(gameData, privKey) });

// CREATE_ASSET FUNCTIONS
export const hashAsset = (params: any) => {
  const { name, desc, image, rarity, cap, val, gameAddr, nonce } = params;
  const assetParamTypes = ['string', 'string', 'string', 'uint256', 'uint256', 'uint256', 'address', 'uint256'];
  const hashes = hashParams([name, desc, image, rarity, cap, val, gameAddr, nonce], assetParamTypes);
  return (hashParam(hashes, 'bytes32[]'));
};

export const hashAndSignAsset = (assetData: any, privKey: any) => {
  const sig = accounts.sign(hashAsset(assetData), privKey);
  return ({ 'signedMessage': sig.signature + sig.message.slice(2) });
};

export const createAssetPostJSON = (assetData: any, privKey: any) => ({ ...assetData, ...hashAndSignAsset(assetData, privKey) });

// MINTING
export const hashAssetMint = (params: any) => {
  const { to, assetId, amount, gameAddr, nonce } = params;
  const mintParamTypes = ['address', 'uint256', 'uint256', 'address', 'uint256'];
  const hashes = hashParams([to, assetId, amount, gameAddr, nonce], mintParamTypes);
  return (hashParam(hashes, 'bytes32[]'));
};

export const hashAndSignMint = (assetData: any, privKey: any) => {
  const sig = accounts.sign(hashAssetMint(assetData), privKey);
  return ({ 'signedMessage': sig.signature + sig.message.slice(2) });
};

export const createAssetMintPostJSON = (assetData: any, privKey: any) => ({ ...assetData, ...hashAndSignMint(assetData, privKey) });

// TRADE ASSETS
export const hashAssetTrade = (params: any) => {
  const { to, amount, nonce, assetId } = params;
  const tradeParamTypes = ['address', 'uint256', 'uint256', 'uint256'];
  const hashes = hashParams([to, amount, nonce, assetId], tradeParamTypes);
  return (hashParam(hashes, 'bytes32[]'));
};

export const hashAndSignTrade = (tradeData: any, privKey: any) => {
  const sig = accounts.sign(hashAssetTrade(tradeData), privKey);
  return ({ 'signedMessage': sig.signature + sig.message.slice(2) });
};

export const createAssetTradePostJSON = (tradeData: any, privKey: any) => ({ ...tradeData, ...hashAndSignTrade(tradeData, privKey) });

/* eslint-disable */
// ? exports.hashParam = hashParam;
// ? exports.hashParams = hashParams;
/* eslint-enable */
// exports.createWallet = createWallet;
// exports.hashGame = hashGame;
// exports.hashAndSignGame = hashAndSignGame;
// exports.createGamePostJSON = createGamePostJSON;
// exports.hashAsset = hashAsset;
// exports.hashAndSignAsset = hashAndSignAsset;
// exports.createAssetPostJSON = createAssetPostJSON;
// exports.hashAssetMint = hashAssetMint;
// exports.hashAndSignMint = hashAndSignMint;
// exports.createAssetMintPostJSON = createAssetMintPostJSON;
// exports.hashAssetTrade = hashAssetTrade;
// exports.hashAndSignTrade = hashAndSignTrade;
// exports.createAssetTradePostJSON = createAssetTradePostJSON;
