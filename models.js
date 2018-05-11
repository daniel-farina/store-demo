const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

// --- Merchant ---

var MerchantSchema = new Schema({
  xpub: {type: String, required: true},
  address_index: {type: Number, default: 0} 
}, {timestamps: true});

var Merchant = mongoose.model('Merchant', MerchantSchema);

// --- Product ---

var ProductSchema = new Schema({
  price_satoshis: {type: Number, required: true},
  name: String 
}, {timestamps: true});

var Product = mongoose.model('Product', ProductSchema);

// --- Invoice ---

var InvoiceSchema = new Schema({
  product_id: {type: ObjectId, ref: 'Product', required: true},
  total_satoshis: {type: Number, required: true},
  address_index: {type: Number, required: true},
  user_address: String,
  blockchain_tx_id: String
}, {timestamps: true});

var Invoice = mongoose.model('Invoice', InvoiceSchema);


module.exports = {Merchant: Merchant, Product: Product, Invoice: Invoice};
