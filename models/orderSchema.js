
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
    },
    productImages: {
      type: [String],
      default: []
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: {
        name: { type: String, },
        phone: { type: String, },
        pincode: { type: String, },
        locality: { type: String },
        address: { type: String, },
        city: { type: String, },
        state: { type: String, },
        landmark: { type: String },
        alternatePhone: { type: String },
        addressType: {
          type: String,
          enum: ['home', 'work'],
          default: 'home'
        }
      },
      required: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'return request',
        'returned',
        'failed',
      ],
      required: true,
      default: 'pending',
    },
    cancelReason: {
      type: String,
      // required: function() { return this.status === 'cancelled'; }, // Required if cancelled
    },
    returnReason: {
      type: String,
      required: function () { return this.status === 'return request' || this.status === 'returned'; },
    },
    paymentMethod: {
      type: String,
      required: true, // Make required if payment is always needed

    },
    couponApplied: {
      type: Boolean,
      default: false,
    },
    couponCode: {
      type: String,
      required: false,
    },
    deliveredOn: {
      type: Date,
    }
  },
  { timestamps: true }
);


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
