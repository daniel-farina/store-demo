'use strict';

// BIP44 + BIP39

const BitcoreLib = require('bitcore-lib');
const Mnemonic = require('bitcore-mnemonic');

// TODO Prompt for an optional password
let pwd = 'OPTIONAL PASSWORD';

console.log('Generating your Master Private Key - Seed Words (BIP39) - this will only be shown ONCE!');
var seed = new Mnemonic(Mnemonic.Words.ENGLISH);
console.log(seed);
var xprv = seed.toHDPrivateKey(pwd);
//var xprv = BitcoreLib.HDPrivateKey();
console.log('xprv: ', xprv.toString());

let addressIndex = 0;

const externalAddrPath = "m/44'/183'/0'/0/"; // BIP-0044 + SLIP-0044

var firstKey = xprv.deriveChild(externalAddrPath + addressIndex).privateKey;
console.log('First PRIVATE KEY (compressed)');
console.log(firstKey);
console.log(firstKey.toWIF());

var firstAddr = firstKey.toAddress();
console.log('First address');
console.log(firstAddr);
