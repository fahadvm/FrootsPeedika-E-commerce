const mongoose = require('mongoose');
const { TransactionType, TransactionStatus } = require('../helpers/constants');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0,
        required: true
    },
    transactions: [  // Corrected array format
        {
            description: {
                type: String,
                trim: true,
                default: 'Transaction'
            },
            amount: {
                type: Number,
            },
            type: {
                type: String,
                enum: Object.values(TransactionType)
            },
            date: {
                type: Date,
                default: Date.now
            },
            referenceId: {
                type: String,
                trim: true
            },
            status: {
                type: String,
                enum: Object.values(TransactionStatus),
                default: TransactionStatus.COMPLETED
            }
        }
    ]
}, { timestamps: true }); // Auto-updates createdAt and updatedAt

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
