'use strict';

const Mnemonic = require('bitcore-mnemonic');

console.log('Generating your Master Private Key - Seed Words (BIP39) - this will only be shown ONCE!');

var seed = new Mnemonic(Mnemonic.Words.ENGLISH);
var xprv = seed.toHDPrivateKey('OPTIONAL PASSWORD');
console.log('xprv: ', seed.toString());
var xpub = xprv.xpubkey.toString();
console.log('xpub (corresponds to addrs; use this as input when running): ', xpub);



