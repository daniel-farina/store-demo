'use strict';

// DO NOT RUN THIS FILE FROM THE BROWSER, SHOULD BE RUN ON SERVER ONLY IF REALLY NEEDED

// Detect if calling via CLi or API
const processScope = process.argv[2] == "-browser"
  ? "browser"
  : "CLI"

// Get merchant ID, wallet ID and derived XPub
const merchantID = process.argv[3];
const walletID = process.argv[4];
const derivedXPub = process.argv[5];

// BTCP - BIP44 + BIP39 / HD wallet setup

// Get bitcore and path
//const bitcore = require('bitcore-lib');// BROKEN BIP32!!!
var path = require("path");

// Get Mnemonic, extarnal address oath and generate seed
const Mnemonic = require('bitcore-mnemonic');
const externalAddrPath = "m/44'/183'/0'"; // BIP-0044 + SLIP-0044
const seed = new Mnemonic(Mnemonic.Words.ENGLISH); // Generate

// Get Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); //finally()

// Get schemas
const Merchant = require('./models.js').Merchant;
const Product = require('./models.js').Product;

// Get our options object
var options = require('read-config')(path.join(__dirname, '/../../bitcore-node.json')).servicesConfig['store-demo'];

// Establish HD wallet details
var xprv = seed.toHDPrivateKey();
var xpub = xprv.hdPublicKey;
var derivedHDPublicKey = xprv.deriveChild(externalAddrPath).hdPublicKey;
var derivedXpubkey = derivedHDPublicKey.xpubkey.toString();

// Set out dummy URL and start a connection
const DUMMY_MONGO_URL = 'mongodb://localhost:27017/store-demo';
mongoose.connect(options.mongoURL || DUMMY_MONGO_URL, null).then(m => {

  if (processScope == "CLI") {
    console.log(
      '\n'+
      '\x1b[36m'+
      '============================================\n'+
      '=== BITCOIN PRIVATE - MERCHANT SOLUTIONS ===\n'+
      '===   SCRIPT: GENERATE MERCHANT WALLET   ===\n'+
      '============================================\n'+
      '\n'+
      '\x1b[32m=== INFO ===\n'+
      '\x1b[36mGenerating your Master Private Key - this will only be shown ONCE!\n'+
      'There are two representations - xprv or Mnemonic Seed Words. You will be shown both.\n'+
      'For reference the "HD Derivation Path" used is m/44\'/183\'0\'/0/0 - you should store this information with your keys.'+
      '\x1b[0m\n'
    )
  }
  //TODO console.log("Press 'Y' to generate and display your Master Private Key");

  //TODO Prompt for an optional password (should we even?)
  //const pwd = 'OPTIONAL PASSWORD';

  // Store derived xpub (for address generation) in only one mongodb Merchant
  Merchant.findOne(
    {
      merchant_id : merchantID,
      wallet_id : walletID
    }
  )
  .exec()
  .then(m => {
    if (m) {
      // Update/Replace?
      if (m.xpub == null) {
        m.wallet_id = walletID;
        m.xpub = derivedXpubkey;
        return m.save();
      } else { // Don't touch existing xpub
        //console.log(m.xpub);
        if (processScope == "CLI") {
          return mongoose.Promise.reject(
            '\x1b[31mYou already have an xpub for address generation!!! Script cancelled.\n'+
            '\x1b[0m'
          );
        }
        if (processScope == "browser") {
          return mongoose.Promise.reject(
            '\nMerchant ID: '+merchantID+' ... \x1b[31mYou already have an xpub for address generation!!! Script cancelled.'+
            '\x1b[0m'
          );
        }
      }
    } else {
      return Merchant.create({
        merchant_id: merchantID,
        wallet_id: walletID,
        xpub: derivedXpubkey,
        address_index: 0
      });
    }
  })
  .then(m => {
    // Merchant added to MongoDB, show report data for user
    outputPrivateData();
    // EXAMPLE - initial dummy product 'pizza'
    // return Product.create({product_id: 1, invoice_id: 2, description: 'pizza', price_satoshis: '6912345678'});
  })
  .then(p => {
    // EXAMPLE - display us product._id to test with
    // console.log(`\x1b[33mDemo Product - ${p.name} - created in mongodb. product._id: \x1b[0m${p._id}`);
    // console.log('\nTry it at localhost:8001/store-demo/index.html\n');
  })
  .catch(e => {
    console.error(e);
  })
  .finally(() => {
    mongoose.disconnect();

    process.exit(0);
  });
})

var getAddress = (baseHDPublicKey, index) => {
  return baseHDPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
}

// --- Setup Report ---
var outputPrivateData = () => {
  if (processScope == "CLI") {
    console.log(
      '\x1b[32m=== PRIVATE DATA ===\n\x1b[0mUou never need to input or display these, even on your own server.\n\n'+
      '\x1b[33mMerchant ID:\n'+
      '\x1b[0m'+merchantID+'\n\n'+
      '\x1b[33mWallet ID:\n'+
      '\x1b[0m'+walletID+'\n\n'+
      '\x1b[33mMaster Private Key:\n'+
      '\x1b[0m'+xprv.toString()+'\n\n'+
      '\x1b[33mMnemonic Seed Words (easier to write down) ("HD Derivation Path" is m/44\'/183\'/0\'):\n'+
      '\x1b[0m'+seed.toString()+'\n\n'+
      'The following is used to generate your future invoice addresses:\n'+
      '\x1b[33mMaster Public Key:\n'+
      '\x1b[0m'+xpub.toString()+'\n\n'+
      '\x1b[32m=== DATA STORED IN DB ===\n'+
      '\x1b[33mDerived xpub (at path m/44\'/183\'/0\') (this is now stored on your server, in MongoDB, for address generation):\n'+
      '\x1b[0m'+derivedXpubkey+'\n'
    )
  }
  if (processScope == "browser") {
    process.stdout.write(
      '{\n'+
      '  "status"        : "ok",\n'+
      '  "statusMessage" : "success",\n'+
      '  "merchantID"    : '+merchantID+',\n'+
      '  "walletID"      : '+walletID+',\n'+
      '  "xprv"          : "'+xprv.toString()+'",\n'+
      '  "seed"          : "'+seed.toString()+'",\n'+
      '  "xpub"          : "'+xpub.toString()+'",\n'+
      '  "xpubDerived"   : "'+derivedXpubkey+'"\n'+
      '}'
    );
  }
}
