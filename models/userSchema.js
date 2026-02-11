const mongoose = require('mongoose')
const { Schema } = mongoose
const { v4: uuidv4 } = require('uuid');



const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: false
    },
    password: {
        type: String,
        required: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    firstName: {
        type: String,
        required: false
    },
    secondName: {
        type: String,
        required: false
    },
    gender: {
        type: String,
        required: false
    },
    image: {
        type: [String],
        require: false
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart",
    }],
    wallet: {
        type: Number,
        default: 0
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Product"
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    createdOn: {
        type: Date,
        default: Date.now
    },
    referCode: {
        type: String,
        default: () => uuidv4(),
    },
    redeemcode: {
        type: String
    },
    redeemed: {
        type: Boolean
    },
    redeemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "category"
        },
        searchOn: {
            type: Date,
            default: Date.now
        }
    }]
})

const User = mongoose.model("User", userSchema)

module.exports = User;