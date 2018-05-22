'use strict';
//Load config file
var path = require("path");
var config = require('read-config')(path.join(__dirname, 'config.json'));


// Set initial details, also set here for global scoping reasons
var baseHDPubKey = ""
var addressIndex = 0
var widgetAddress = ""

// Output error according to our processScope
var outputError = function(error) {
  if (processScope == "CLI") {
    console.log(
      'Error: '+error+
      ' for merchant ID: '+merchantID+
      ', wallet ID: '+walletID+
      ', address index: '+addressIndex+
      ', derived xpub: '+derivedXPub
    );
  }
/*
  if (processScope == "browser") {
    process.stderr.write(
      '{\n'+
      '  "status"        : "error",\n'+
      '  "statusMessage" : "'+error+'"\n'+
      '}'
    )
  }
*/
}

// Detect if calling via CLi or API
const processScope = process.argv[2] == "-browser"
  ? "browser"
  : "CLI"

// Get merchant ID, wallet ID and derived XPub
const merchantID = process.argv[3];
const walletID = process.argv[4];
const derivedXPub = process.argv[5];

// Check we have all we need to proceed
/*
TOOD - Get this revised and finalised
if (!merchantID || merchantID < 0 ||
    !walletID || walletID < 0 ||
    !derivedXPub) {
//   outputError('Sorry, not all arguments expected were received');
}
*/

// Get bitcore and path
const bitcore = require('bitcore-lib');// BROKEN BIP32!!!
var path = require("path");

// Get Mongoose
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird'); //finally()

// Get schemas
const Merchant = require('./models.js').Merchant;
const Product = require('./models.js').Product;

// Get our options object
var options = require('read-config')(path.join(__dirname, '/../../bitcore-node.json')).servicesConfig['store-demo'];

// Set out dummy URL and start a connection
const DUMMY_MONGO_URL = config.MongoDb;
mongoose.connect(options.mongoURL || DUMMY_MONGO_URL, null).then(m => {

  if (processScope == "CLI") {
    console.log(
      '\n'+
      '\x1b[36m'+
      '============================================\n'+
      '=== BITCOIN PRIVATE - MERCHANT SOLUTIONS ===\n'+
      '===       SCRIPT: GET WALLET ADDRESS     ===\n'+
      '============================================\n'+
      '\n\x1b[32m=== INFO ===\n'+
      '\x1b[36mGenerating your wallet address to use within the BTCP widget...\n'
    )
  }

  // Find our merchant & wallet combo
  Merchant.findOne(
    {
      merchant_id : merchantID,
      wallet_id : walletID
    }
  )
  .exec()
  .then(m => {
    // If we have an entry for this combo
    if (m) {
      // IF not found xpub, insert an entry
      if (m.xpub == null) {
        try {
          baseHDPubKey = new bitcore.HDPublicKey(derivedXPub);
        } catch(error) {
          outputError(error);
          mongoose.disconnect();
          process.exit(0);
        }
        // Save the derived xpub
        m.xpub = derivedXPub;
        return m.save();
      // We have an xpub, increment address_index
      } else {
        // Get HD pub key and address index
        try {
          baseHDPubKey = new bitcore.HDPublicKey(m.xpub);
        } catch(error) {
          outputError(error);
          mongoose.disconnect();
          process.exit(0);
        }
        addressIndex = m.address_index;
        // Increment address_index ready for next time
        Merchant.update(
          {'xpub': m.xpub},
          {$inc: {address_index: 1}},
          {multi: true},
          function(err, result) {
              mongoose.disconnect();
              process.exit(0);
          })
      }
    // No entry found, we need to create one
    } else {
      try {
        baseHDPubKey = new bitcore.HDPublicKey(derivedXPub);
      } catch(error) {
        outputError(error);
        mongoose.disconnect();
        process.exit(0);
      }
      // Add the entry and set address_index to to 1 for next time
      return Merchant.create({
        merchant_id: merchantID,
        wallet_id: walletID,
        xpub: derivedXPub,
        address_index: 1
      },
      function(err, result) {
              mongoose.disconnect();
              process.exit(0);
         }
      );
    }
  })
  .then(m => {
    // Generate the widget address based on derived HD pub key and address index
    widgetAddress = getAddress(baseHDPubKey, addressIndex);
    // Then output data in an appropriate format according to processScope
    outputData();

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
//    mongoose.disconnect();
//    process.exit(0);
  });
})

// Function to get widget address
var getAddress = (baseHDPublicKey, index) => {
  try {
    return baseHDPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
  } catch(error) {
    outputError(error);
  }
}

// Output data according to our processScope
var outputData = function() {
  if (processScope == "CLI") {
    console.log(
      "Merchant ID    : "+merchantID+"\n"+
      "Wallet ID      : "+walletID+"\n"+
      "Address Index  : "+addressIndex+"\n"+
      "Widget Address : "+widgetAddress+
      "\n\x1b[0m"
    );
  }
  if (processScope == "browser") {
    process.stdout.write(
      '{\n'+
      '  "status"        : "ok",\n'+
      '  "statusMessage" : "success",\n'+
      '  "merchantID"    : '+merchantID+',\n'+
      '  "walletID"      : '+walletID+',\n'+
      '  "addressIndex"  : '+addressIndex+',\n'+
      '  "widgetAddress" : "'+widgetAddress+'"\n'+
      '}'
    )
  }
}
