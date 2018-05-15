'use strict';

// Detect if calling via CLi or API
const processScope = process.argv[2] == "-browser"
  ? "browser"
  : "CLI"

// Mongoose
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); //finally()

const Merchant = require('./models.js').Merchant;
const Product = require('./models.js').Product;
const Invoice = require('./models.js').Invoice;

const DUMMY_MONGO_URL = 'mongodb://localhost:27017/store-demo';
mongoose.connect(DUMMY_MONGO_URL);

const merchantID = 1;

if (processScope == "CLI") {
  console.log(
    '\n'+
    '\x1b[36m'+
    '============================================\n'+
    '=== BITCOIN PRIVATE - MERCHANT SOLUTIONS ===\n'+
    '===     SCRIPT: COMPLETE TRANSACTION     ===\n'+
    '============================================\n'+
    '\n\x1b[32m=== INFO ===\n'+
    '\x1b[36mCompleting user transaction...\n'
  )
}

/*
var getAddress = (baseHDPublicKey, index) => {
  return baseHDPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
}
*/

// TODO - need to get actual xpub and index from DB here
// var derivedXpubkey = "xpub6CbGyXbq8V1EAXjhwRGqup7c21AQfMo9vsMjBPX72fVN7DUbrgCNb2nEe1KGniUUF2QCQ3KiBZQpDzpWbRPgzTfKZgR395833P67PuNPCBr";
// let index = 0

var product = Invoice.create({
  invoice_id: 1,
  merchant_id: merchantID,
  total_satoshis: '1234567890',
  address_index: '0',
  merchant_address: 'cba231yxz564',
  user_address: 'abc123xyz456',
  blockchain_tx_id: '654zyx321cba'
})

/*
TODO: Add a product entry also
var product = Product.create({
  product_id: 1,
  invoice_id: 2,
  description: 'pizza',
  price_satoshis: '6912345678'
})
*/

// TODO - why isn't this giving us a BTCP address?
// var widgetAddress = getAddress(derivedHDPublicKey, index)
// var widgetAddress = getAddress(derivedXpubkey, index)

// TODO: relevant output here...
var widgetAddress = "xyz123";

if (processScope == "CLI") {
  console.log(
    "TOOOOOOOOOOOOO DOOOOOOOOOOO Widget Address: "+widgetAddress+
    "\n\x1b[0m"
  );
}

if (processScope == "browser") {
  process.stdout.write(
    '{\n'+
    '  "TOOOOOOOOOOOOO DOOOOOOOOOO status"        : "ok",\n'+
    '  "statusMessage" : "success",\n'+
    '  "merchantID"    : '+merchantID+',\n'+
    '  "widgetAddress" : "'+widgetAddress+'"\n'+
    '}'
  )
}

process.exit(1);
