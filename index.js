'use strict';

// Output error according to our processScope
var outputError = function(error) {
  console.log(
    'Error: '+error+
    ' for merchant ID: '+req.query.merchantid+
    ', wallet ID: '+req.query.walletid+
    ', derived xpub: '+req.query.derivedxpud
  );
  return
    '{\n'+
    '  "status"        : "error",\n'+
    '  "statusMessage" : "'+error+'"\n'+
    '}'
}

var EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const bitcore = require('bitcore-lib');// BROKEN BIP32!!!
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var path = require("path");
var exec = require('child_process').exec;

var config = require('read-config')(path.join(__dirname, 'config.json'));

//const io = require('socket.io');

const Merchant = require('./models').Merchant;
const Invoice = require('./models').Invoice;
const Product = require('./models').Product;
const DUMMY_MONGO_URL = config.MongoDb;

function PizzaShop(options) {
  EventEmitter.call(this);

  this.node = options.node;
  this.log = this.node.log;

  this.invoiceHtml = fs.readFileSync(__dirname + '/invoice.html', 'utf8');

  // Connect to MongoDB
  mongoose.connect(options.mongoURL || DUMMY_MONGO_URL, null)
  .then(() => {

    Merchant.findOne({})
    .select('xpub')
    .exec()
    .then(m => {
      if (!m || m.xpub == null) {
        return mongoose.Promise.reject("xpub hasn't been set!!! Run `node generate_hd_wallets` offline.");
      } else {
        this.xpub = m.xpub;
      }
    })
    .catch(e => {
      this.log.error(e);
    });
  }, e => { this.log.error(e.message); });

  //TODO Implement State Machine: AWAITING_PAYMENT -> FULL_AMOUNT_RECEIVED / TIMED_OUT / PARTIAL_AMOUNT_RECEIVED
  //TODO reuse code from invoice.html (client)

/* TODO socket config
  var socket = io('http://localhost:8001');
  socket.emit('subscribe', 'bitcoind/addresstxid', ['{{address}}']);
  socket.on('bitcoind/addresstxid', function(data) {
   var address = bitcore.Address(data.address);
   this.log.info(address);
     //TODO save an entry in db for each confirmed payment, for each relevant addr
     // index (or address), tx_id, address_paid, amount_paid, latest_paid_time, total_satoshis
  });
*/

  //TODO disconnect mongoose, socket.io

}

PizzaShop.dependencies = ['bitcoind'];

PizzaShop.prototype.start = function(callback) {
  setImmediate(callback);
};

PizzaShop.prototype.stop = function(callback) {
  setImmediate(callback);
};

PizzaShop.prototype.getAPIMethods = function() {
  return [];
};

PizzaShop.prototype.getPublishEvents = function() {
  return [];
};


PizzaShop.prototype.setupRoutes = function(app, express) {
  var self = this;

  app.use(bodyParser.urlencoded({extended: true}));

  // Serve 'static' dir at localhost:8001
  app.use('/', express.static(__dirname + '/static'));

  // *** Invoice Server model ***
  // To generate an invoice,
  // POST localhost:8001/invoice {productID: String}
  // (DB starts at addressIndex `1`)
  // TODO Rate limit per ip
  // TODO deliveryEmail (optional)

  // TODO represent as state machine on both client and srv - AWAITING_PAYMENT -> FULL_AMOUNT_RECEIVED / TIMED_OUT / PARTIAL_AMOUNT_RECEIVED

  // /get_wallet_address path
  app.get('/get_wallet_address', function (req, res) {
// Check we have all we need to proceed
/*
    TODO: Revise this
    if (!req.query.merchantid || req.query.merchantid < 0 ||
      !req.query.walletid || req.query.walletid < 0 ||
      !req.query.derivedxpub) {
      res.send(outputError('Sorry, not all arguments expected were received'));
    }
*/
    // Check we have correct API key
    if (req.query.apikey != config.apiKey) {
      console.log("\x1b[31mGetting wallet address - API key not provided or incorect: "+req.query.apikey+"\x1b[0m");
      res.send(
        '{\n'+
        '  "status"        : "error",\n'+
        '  "statusMessage" : "no API key provided or incorrect"\n'+
        '}'
      )
    } else {
      // Execute our file with 'browser' process scope argument
       // TODO: regex on derivedxpub to only allow alphanums
       // +("undefined" != typeof req.query.derivedxpub ? req.query.derivedxpub.replace(/^[a-z0-9]+$/i,'') : '')
      var cp = exec('node ~/btcp-explorer/node_modules/store-demo/get_wallet_address.js -browser '
       +parseInt(req.query.merchantid,10)+" "
       +parseInt(req.query.walletid,10)+" "
       +req.query.derivedxpub
       ,function callback(error, stdout, stderr){
        // If error, console log it, return error JSON
        if (error) {
          console.log(error)
          res.send(
            '{\n'+
            '  "status"        : "error",\n'+
            '  "statusMessage" : "callback error when getting wallet address: '+error+'"\n'+
            '}'
          )
        // If strerr, console log it, return error JSON
        } else if (stderr != "") {
          console.log(stderr)
          res.send(
            '{\n'+
            '  "status"        : "error",\n'+
            '  "statusMessage" : "stderr when getting wallet address: '+stderr+'"\n'+
            '}'
          )
        // If successful stdout, return JSON (need to chop off any string to the left
        // of array which seems to be output by bitcore lib
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.send(stdout.substr(stdout.indexOf("{")))
        }
        // Kill the child process
        cp.kill('SIGINT')
      });
    }
  })

  // /complete_transaction path-- TODO!
/*
  app.get('/complete_transaction', function (req, res) {
    // Check we have correct API key
    if (req.query.apikey != config.apiKey) {
      console.log("\x1b[31mCompleting transaction - API key not provided or incorect: "+req.query.apikey+"\x1b[0m");
      res.send(
        '{\n'+
        '  "status"        : "error",\n'+
        '  "statusMessage" : "no API key provided or incorrect"\n'+
        '}'
      )
    } else {
      // Execute our file with 'browser' process scope argument
      var cp = exec('node ~/btcp-explorer/node_modules/store-demo/complete_transaction.js -browser', function callback(error, stdout, stderr){
        // If error, console log it, return error JSON
        if (error) {
          console.log(error)
          res.send(
            '{\n'+
            '  "status"        : "error",\n'+
            '  "statusMessage" : "callback error when completing transaction: '+error+'"\n'+
            '}'
          )
        // If strerr, console log it, return error JSON
        } else if (stderr != "") {
          console.log(stderr)
          res.send(
            '{\n'+
            '  "status"        : "error",\n'+
            '  "statusMessage" : "stderr when getting completing transaction: '+stderr+'"\n'+
            '}'
          )
        // If successful stdout, return JSON (need to chop off any string to the left
        // of array which seems to be output by bitcore lib
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.send(stdout.substr(stdout.indexOf("{")))
        }
        // Kill the child process
        cp.kill('SIGINT')
      });
    }
  })
*/

  /*
  app.post('/invoice', function(req, res, next) {
    self.log.info('POST /invoice: ', req.body);
    let productID = req.body._id || req.body.productID;
    var addressIndex;

    // Generate (next) fresh address & present invoice
    Merchant.findOneAndUpdate({}, {$inc: {address_index: 1}})
    .exec()
    .then(m => {
      addressIndex = m.address_index;
      return Product.findById(productID).exec();
    })
    .then(p => {
      if (!p) {
        return mongoose.Promise.reject('No products in DB!');
      }
      return Invoice.create({address_index: addressIndex, product_id: p._id, total_satoshis: p.price_satoshis});
    })
    .then(i => {
      // Content-Type: text/html
      return res.status(200).send(self.buildInvoiceHTML(i.address_index, i.total_satoshis));
    })
    .catch(e => {
      self.log.error(e);
      return res.status(500).send({error: 'Failed to find Merchant/create Invoice in Mongo'});
    });
  });
  */

};

PizzaShop.prototype.getRoutePrefix = function() {
  return 'store-demo';
};

PizzaShop.prototype.buildInvoiceHTML = function(addressIndex, totalSatoshis) {
  let price = totalSatoshis / 1e8; // (100,000,000 sats == 1 BTCP)

  // Address for this invoice
  // Here, "/0/" == External addrs, "/1/" == Internal (change) addrs
  //TODO - use correct lib+method - bitcore-lib and deriveChild
  //let b_new = require('bitcore-lib');
  //let k = b_new.HDPublicKey(this.xpub);
  //let address = k.deriveChild("/0/" + addressIndex).publicKey.toAddress();
  let k = bitcore.HDPublicKey(this.xpub);
  let address = k.derive("m/0/" + addressIndex).publicKey.toAddress();

  // Hash, aka the H of P2PKH or P2SH
  let hash = address.hashBuffer.toString('hex');

  this.log.info('New invoice, with generated address:', address);

  var transformed = this.invoiceHtml
    .replace(/{{price}}/g, price)
    .replace(/{{address}}/g, address)
    .replace(/{{hash}}/g, hash)
    .replace(/{{baseUrl}}/g, '/' + this.getRoutePrefix() + '/');
  return transformed;
};

module.exports = PizzaShop;
