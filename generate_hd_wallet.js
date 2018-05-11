'use strict';

// BTCP - BIP44 + BIP39 / HD wallet setup

const Mnemonic = require('bitcore-mnemonic');

const externalAddrPath = "m/44'/183'/0'"; // BIP-0044 + SLIP-0044
const seed = new Mnemonic(Mnemonic.Words.ENGLISH); // Generate

// Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); //finally()

const Merchant = require('./models.js').Merchant;

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

var hdPublicKey = xprv.deriveChild(externalAddrPath).hdPublicKey;

var xpubkey = hdPublicKey.xpubkey.toString();

// Store xpub in (only/Singleton) mongo Merchant
Merchant.findOne({})
.exec()
.then(m => {
  if (m) {
    // Update/Replace?
    if (m.xpub == null) { 
      m.xpub = xpubkey;
      return m.save();
    } else { // Don't touch existing xpub
      //console.log(m.xpub);
      return mongoose.Promise.reject('\nYou already have an xpub!!! Script canceled.');
    }
  } else {
    return Merchant.create({xpub: xpubkey});
  }
})
.then(m => {
  //console.log('Merchant added to mongo successfully');
  //console.log(m);
  setupReport();

  // EXAMPLE - store-demo - select an address
  getAddress(0);
})
.catch(e => {
  console.error(e);
})
.finally(() => {
  mongoose.disconnect();
});


// --- Setup Report ---
var setupReport = () => {
  console.log('\n---');
  console.log('\nMaster Private Key: ');
  console.log('\nSHH! - you never need to input or display these, even on your own server.');

  console.log('\nxprv: ');
  console.log(xprv.toString());
  console.log('\nMnemonic Seed Words (easier to write down) ("HD Derivation Path" is m/44\'/183\'/0\'): ');
  console.log(seed.toString());

  console.log('\nMaster Public Key: ');

  console.log('\nDerived xpub (this is now stored on your server, in MongoDB, to safely generate all addresses): ');
  console.log(xpubkey);

  console.log('\n---');
}

var getAddress = (index) => {
  var address = hdPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
  console.log(`\n${index}: `, address);
}
