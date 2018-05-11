const mongoose = require('mongoose');
var Schema = mongoose.Schema;


// --- Merchant ---

var MerchantSchema = new Schema({
  xpub: {type: String, required: true},
  addressIndex: {type: Number, default: 0} 
});

// Compile model from schema
var Merchant = mongoose.model('Merchant', MerchantSchema);

// --- Product ---

var ProductSchema = new Schema({
  price: {type: Number, required: true},
  name: String 
});

var Product = mongoose.model('Product', ProductSchema);

// --- Invoice ---

var InvoiceSchema = new Schema({
  productID: {type: String, required: true},
  amount: {type: Number, required: true},
  addressIndex: {type: Number, required: true},
  btcpTxID: String
});

var Invoice = mongoose.model('Invoice', InvoiceSchema);

//TODO created.at,_by

module.export = {Merchant: Merchant, Product: Product, Invoice: Invoice};
