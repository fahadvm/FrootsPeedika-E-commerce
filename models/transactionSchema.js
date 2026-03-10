const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const { TransactionStatus, TransactionType, PaymentMethod, PaymentGateway, TransactionPurpose } = require('../helpers/constants');

const transactionSchema = new Schema({
    transactionId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionType: {
        type: String,
        enum: Object.values(TransactionType),
        required: true
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true
    },
    paymentGateway: {
        type: String,
        enum: Object.values(PaymentGateway),
        default: PaymentGateway.NONE
    },
    gatewayTransactionId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        default: TransactionStatus.COMPLETED
    },
    purpose: {
        type: String,
        enum: Object.values(TransactionPurpose),
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    orders: [
        {
            name: { type: String, },
            price: { type: Number, },
            quantity: { type: Number, },
            discount: { type: Number, default: 0 },
            finalPrice: { type: Number, },
        }
    ],
    orderIds: [
        {
            orderId: { type: String }
        }
    ],
    walletBalanceAfter: {
        type: Number,
        default: null
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });

transactionSchema.index({ 'orders.orderId': 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;