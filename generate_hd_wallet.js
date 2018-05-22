'use strict';

// BTCP - BIP44 + BIP39 / HD wallet setup

const Mnemonic = require('bitcore-mnemonic');

const externalAddrPath = "m/44'/183'/0'"; // BIP-0044 + SLIP-0044
const seed = new Mnemonic(Mnemonic.Words.ENGLISH); // Generate

// Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); //finally()

const Merchant = require('./models.js').Merchant;
const Product = require('./models.js').Product;

const DUMMY_MONGO_URL = 'mongodb://localhost:27017/store-demo';
mongoose.connect(DUMMY_MONGO_URL);

console.log('\nGenerating your Master Private Key - this will only be shown ONCE!');
console.log('\nThere are two representations - xprv or Mnemonic Seed Words. You will be shown both.');
console.log('\nFor reference the "HD Derivation Path" used is m/44\'/183\'0\'/0/0 - you should store this information with your keys.');
//TODO console.log("Press 'Y' to generate and display your Master Private Key"); 
//TODO bright colors

//TODO Prompt for an optional password (should we even?)
//const pwd = 'OPTIONAL PASSWORD';

var xprv = seed.toHDPrivateKey();
var xpub = xprv.hdPublicKey;

var derivedHDPublicKey = xprv.deriveChild(externalAddrPath).hdPublicKey;
var derivedXpubkey = derivedHDPublicKey.xpubkey.toString();

// Store derived xpub (for address generation) in only one mongodb Merchant
Merchant.findOne({})
.exec()
.then(m => {
  if (m) {
    // Update/Replace?
    if (m.xpub == null) { 
      m.xpub = derivedXpubkey;
      return m.save();
    } else { // Don't touch existing xpub
      //console.log(m.xpub);
      return mongoose.Promise.reject('\nYou already have an xpub for address generation!!! Script canceled.');
    }
  } else {
    return Merchant.create({xpub: derivedXpubkey});
  }
})
.then(m => {
  //console.log('Merchant added to mongodb successfully');
  //console.log(m);
  setupReport();

  // EXAMPLE - derive address by index
  let index = 0;
  console.log(`\nIndex ${index}: ${getAddress(derivedHDPublicKey, index)}`);

  // EXAMPLE - initial dummy product 'pizza'
  return Product.create({name: 'pizza', price_satoshis: '690000000'});
})
.then(p => { 
  // EXAMPLE - display us product._id to test with
  console.log(`\nDemo Product - ${p.name} - created in mongodb. product._id: ${p._id}`);
  console.log('\nTry it at localhost:8001/store-demo/index.html\n');
})
.catch(e => {
  console.error(e);
})
.finally(() => {
  mongoose.disconnect();
});

var getAddress = (baseHDPublicKey, index) => {
  return baseHDPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
}

// --- Setup Report ---
var setupReport = () => {
  console.log('\n---');
  console.log('\n- SHH! - you never need to input or display these, even on your own server. -');

  console.log('\nMaster Private Key: ');
  console.log(xprv.toString());

  console.log('\nMnemonic Seed Words (easier to write down) ("HD Derivation Path" is m/44\'/183\'/0\'): ');
  console.log(seed.toString());

  console.log('\n\nThe following is used to generate your future invoice addresses: ');

  console.log('\nMaster Public Key: ');
  console.log(xpub.toString());

  console.log('\nDerived xpub (at path m/44\'/183\'/0\') (this is now stored on your server, in MongoDB, for address generation): ');
  console.log(derivedXpubkey);

  console.log('\n---');
}

