'use strict';

// BTCP BIP44 + BIP39 hd wallet setup

const Mnemonic = require('bitcore-mnemonic');

const externalAddrPath = "m/44'/183'/0'"; // BIP-0044 + SLIP-0044


console.log('Generating your Master Private Key - this will only be shown ONCE!');
//TODO press 'Y' button to generate + display

//TODO Prompt for an optional password
//const pwd = 'OPTIONAL PASSWORD';

var seed = new Mnemonic(Mnemonic.Words.ENGLISH);
var xprv = seed.toHDPrivateKey();

var hdPublicKey = xprv.deriveChild(externalAddrPath).hdPublicKey;


// Setup Report

console.log('Master Private Key (SHH! - never need to input or display, even on your own server) (two variants): ');
console.log('');

console.log('xprv (more robust): ');
console.log(xprv.toString());
console.log('');
console.log('Seed Words (easier to remember) ("HD Derivation Path" is m/44\'/183\'/0\'): ');
console.log(seed);
console.log('');

var xpubkey = hdPublicKey.xpubkey.toString();
//TODO store xpubkey in mongo Merchant
console.log('xpub (this will be stored on your server, in MongoDB, to safely generate all addresses): ');
console.log(xpubkey);
console.log('');

// EXAMPLE - store-demo - select only the first address
const addressIndex = "0";

var address = hdPublicKey.deriveChild("m/0/" + addressIndex).publicKey.toAddress();
console.log('First address: ', address);


/*
//TODO Remove
//Full Access - Derive Private Keys - (You shouldn't ever need to use this for invoices/addresses) 
var firstKey = xprv.deriveChild(externalAddrPath + "/0/addressIndex").privateKey;
console.log('First PRIVATE KEY (compressed)');
console.log(firstKey);
console.log(firstKey.toWIF());

var firstAddress = firstKey.toAddress();
console.log('First address');
console.log(firstAddress);
*/

