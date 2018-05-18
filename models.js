const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

// --- Merchant ---

var MerchantSchema = new Schema({
  merchant_id: {type: Number, required: true},
  wallet_id: {type: Number, required: true},
  xpub: {type: String, required: true},
  address_index: {type: Number, default: 0}
}, {timestamps: true});

var Merchant = mongoose.model('Merchant', MerchantSchema);

// --- Invoice ---

// TODO - look into using ObjectId as the type? Better to keep as INT tho?
var InvoiceSchema = new Schema({
  invoice_id: {type: Number, required: true},
  merchant_id: {type: Number, required: true},
  total_satoshis: {type: Number, required: true},
  address_index: {type: Number, required: true},
  merchant_address: String,
  user_address: String,
  blockchain_tx_id: String
}, {timestamps: true});

var Invoice = mongoose.model('Invoice', InvoiceSchema);

// --- Product ---

var ProductSchema = new Schema({
  product_id: {type: Number, required: true},
  invoice_id: {type: Number, required: true},
  description: String,
  price_satoshis: {type: Number, required: true}
}, {timestamps: true});

var Product = mongoose.model('Product', ProductSchema);


module.exports = {Merchant: Merchant, Invoice: Invoice, Product: Product};
