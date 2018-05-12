'use strict';

var EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const bitcore = require('bitcore-lib-btcp');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//const io = require('socket.io');

const Merchant = require('./models').Merchant;
const Invoice = require('./models').Invoice;
const Product = require('./models').Product;

const DUMMY_MONGO_URL = 'mongodb://localhost:27017/store-demo';

// This module will be installed as a service of Bitcore, which will be running on localhost:8001.
// TEST - `localhost:8001/store-demo/index.html`

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

  app.post('/invoice', function(req, res, next) {
    let productID = req.body.productID;
    var addressIndex;

    // Generate (next) fresh address & present invoice
    Merchant.findOneAndUpdate({}, {$inc: {address_index: 1}})
    .exec()
    .then(m => {
      addressIndex = m.address_index;
      return Product.findById(productID).exec();
    })
    .then(p => {
      return Invoice.create({address_index: addressIndex, product_id: p._id, total_satoshis: p.price_satoshis}).exec();
    })
    .then(i => {
      // Content-Type: text/html
      return res.status(200).send(self.buildInvoiceHTML(i.address_index, i.total_satoshis));
    })
    .catch(e => {
      this.log.error(e);
      return res.status(500).send({error: 'Failed to find Merchant/create Invoice in Mongo'});
    });
  });

};

PizzaShop.prototype.getRoutePrefix = function() {
  return 'store-demo';
};

PizzaShop.prototype.buildInvoiceHTML = function(addressIndex, totalSatoshis) {
  let price = total / 1e8; // (100,000,000 sats == 1 BTCP)

  // Address for this invoice
  // Here, "/0/" == External addrs, "/1/" == Internal (change) addrs
  let address = this.xpub.deriveChild("/0/" + addressIndex).privateKey.toAddress();

  this.log.info('New invoice, with generated address:', address);

  var hash = address.hashBuffer.toString('hex');
  var transformed = this.invoiceHtml
    .replace(/{{price}}/g, btcpPrice)
    .replace(/{{address}}/g, address)
    .replace(/{{hash}}/g, hash)
    .replace(/{{baseUrl}}/g, '/' + this.getRoutePrefix() + '/');
  return transformed;
};

module.exports = PizzaShop;
