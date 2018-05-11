'use strict';

// BTCP - BIP44 + BIP39 / HD wallet setup

const Mnemonic = require('bitcore-mnemonic');
const Merchant = require('./models').Merchant;

const externalAddrPath = "m/44'/183'/0'"; // BIP-0044 + SLIP-0044


console.log('\nGenerating your Master Private Key - this will only be shown ONCE!');
console.log('\nThere are two representations - xprv or Mnemonic Seed Words. You will be shown both.');
console.log('\nFor reference the "HD Derivation Path" used is m/44\'/183\'0\'/0/0 - you should store this information with your keys.');
//TODO console.log("Press 'Y' to generate and display your Master Private Key"); 
//TODO bright colors

//TODO Prompt for an optional password (should we even?)
//const pwd = 'OPTIONAL PASSWORD';

var seed = new Mnemonic(Mnemonic.Words.ENGLISH);
var xprv = seed.toHDPrivateKey();

var hdPublicKey = xprv.deriveChild(externalAddrPath).hdPublicKey;

var xpubkey = hdPublicKey.xpubkey.toString();

// Store xpub in (only/Singleton) mongo Merchant
Merchant.findOne({})
.exec()
.then(m => {
  if (m) {
    m.xpub = xpubkey;
    return m.save();
  } else {
    return Merchant.create({xpub: xpubkey});
  }
})
.then(m => {
  console.log('Merchant added to mongo successfully: ', m);
  setupReport();

  // EXAMPLE - store-demo - select only the first address
  firstAddress();
})
.catch(e => {
  console.error(e);
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

  //TODO store xpubkey in mongo Merchant
  console.log('\nDerived xpub (this is now stored on your server, in MongoDB, to safely generate all addresses): ');
  console.log(xpubkey);

  console.log('\n---');
}

var firstAddress = () => {
  const addressIndex = "0";

  var address = hdPublicKey.deriveChild("m/0/" + addressIndex).publicKey.toAddress();
  console.log('\nFirst address: ', address);
  console.log('');
}
