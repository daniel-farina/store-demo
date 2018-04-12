'use strict';

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var bitcore = require('bitcore-lib-btcp');
var bodyParser = require('body-parser');

function LemonadeStand(options) {
  EventEmitter.call(this);

  this.node = options.node;
  this.log = this.node.log;

  this.invoiceHtml = fs.readFileSync(__dirname + '/invoice.html', 'utf8');

  this.price = 12340000; // (sats)

  // Use a HD Private Key and generate a unique address for every invoice
  //TODO generate/display once, and from then on, load same xprv ('merchant master private key') from an encrypted db
  this.hdPrivateKey = new bitcore.HDPrivateKey(this.node.network);
  //TODO reload this from db.lastAddressIndex
  this.addressIndex = 0;

  //TODO implement item id's for multiple items; could use same xprv for all

  this.log.info('xprv key:', this.hdPrivateKey);
  this.log.info('addressIndex:', this.addressIndex);
}

LemonadeStand.dependencies = ['bitcoind'];

LemonadeStand.prototype.start = function(callback) {
  setImmediate(callback);
};

LemonadeStand.prototype.stop = function(callback) {
  setImmediate(callback);
};

LemonadeStand.prototype.getAPIMethods = function() {
  return [];
};

LemonadeStand.prototype.getPublishEvents = function() {
  return [];
};

  //TODO Implement State Machine: AWAITING_PAYMENT -> FULL_AMOUNT_RECEIVED / TIMED_OUT / PARTIAL_AMOUNT_RECEIVED

  //TODO Poll on all not-completed (timed_out, full_amount_received) addresses (between 0 -> lastAddressIndex)
  /*  we need to also listen, just like invoice.html -

      var socket = io('http://localhost:8001');
      socket.emit('subscribe', 'bitcoind/addresstxid', ['{{address}}']);
      socket.on('bitcoind/addresstxid', function(data) {
         var address = bitcore.Address(data.address);
         if (address.toString() == '{{address}}') {
           //TODO save an entry in db for each confirmed payment, for each relevant addr
           //db.save({index: index, txid: txid, fromAddress, amount, time})
           ...
  */


LemonadeStand.prototype.setupRoutes = function(app, express) {
  var self = this;

  app.use(bodyParser.urlencoded({extended: true}));

  app.use('/', express.static(__dirname + '/static'));

  // This module will be installed as a service of Bitcore, which will be running on 8001.

  // TO USE (Generate an invoice) -
  // POST localhost:8001/invoice {amount: 100}
  // (or visit localhost:8001)

  app.post('/invoice', function(req, res, next) {
    self.addressIndex++;
    //TODO db.increment(lastAddressIndex)
    //convert from btcp to sats (for static/index.html demo):
    //self.price = parseFloat(req.body.price) * 1e8;
    res.status(200).send(self.filterInvoiceHTML());
  });
};

LemonadeStand.prototype.getRoutePrefix = function() {
  return 'store-demo';
};

LemonadeStand.prototype.filterInvoiceHTML = function() {
  var btcp = this.price / 1e8;
  var address = this.hdPrivateKey.derive(this.addressIndex).privateKey.toAddress();
  this.log.info('New invoice, with generated address:', address);

  var hash = address.hashBuffer.toString('hex'); //TODO shouldn't need this
  var transformed = this.invoiceHtml
    .replace(/{{price}}/g, btcp)
    .replace(/{{address}}/g, address)
    .replace(/{{hash}}/g, hash)
    .replace(/{{baseUrl}}/g, '/' + this.getRoutePrefix() + '/');
  return transformed;
};

module.exports = LemonadeStand;
