'use strict';

// Detect if calling via CLi or API
const processScope = process.argv[2] == "-browser"
  ? "browser"
  : "CLI"

// Get merchant ID
const merchantID = process.argv[3];

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

// Set initial details, also for global scoping reasons
var baseHDPubKey = ""
var addressIndex = 0
var widgetAddress = ""

// Set out dummy URL and start a connection
const DUMMY_MONGO_URL = 'mongodb://localhost:27017/store-demo';
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

  // Find our merchant, increment address_index and get the new wallet address
  Merchant.findOne(
    { merchant_id : merchantID }
  )
  .exec()
  .then(m => {
    if (m) {
      // Should do something if not found!
      if (m.xpub == null) {
//      DO SOMETHING?
      } else {
        // Get HD pub key and address index
        baseHDPubKey = new bitcore.HDPublicKey(m.xpub)
        addressIndex = m.address_index
        // Increment address_index ready for next time
        Merchant.update(
          {'xpub': m.xpub},
          {$inc: {address_index: 1}},
          {multi: true},
          function(err, result) {
//            console.log(result);
//            console.log(err);
            mongoose.disconnect();
            process.exit(0);
          })

        // We now have the derived HD pub key and address index
        baseHDPubKey = new bitcore.HDPublicKey(m.xpub)
        addressIndex = m.address_index
      }
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
  return baseHDPublicKey.deriveChild("m/0/" + index).publicKey.toAddress();
}

// Output data according to our processScope
var outputData = function() {
  if (processScope == "CLI") {
    console.log(
      "Merchant ID: "+merchantID+"\n"+
      "Address Index: "+addressIndex+"\n"+
      "Widget Address: "+widgetAddress+
      "\n\x1b[0m"
    );
  }

  if (processScope == "browser") {
    process.stdout.write(
      '{\n'+
      '  "status"        : "ok",\n'+
      '  "statusMessage" : "success",\n'+
      '  "merchantID"    : '+merchantID+',\n'+
      '  "addressIndex"  : '+addressIndex+',\n'+
      '  "widgetAddress" : "'+widgetAddress+'"\n'+
      '}'
    )
  }
}
