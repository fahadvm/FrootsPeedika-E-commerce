const Wallet = require('../../models/walletSchema')
const User = require('../../models/userSchema')
const { StatusCodes, Messages } = require('../../helpers/constants');
const Razorpay = require("razorpay")
const crypto = require('crypto')
require("dotenv").config()

const loadwallet = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)
    const wallet = await Wallet.findOne({ userId: userId })
    console.log('wallet:', wallet)
    const balance = wallet.balance
    const transactions = wallet.transactions
    return res.render('user/wallet1', { balance, user, transactions, key_id: process.env.RAZORPAY_KEY_ID })
  } catch (error) {
    console.error('error occur while loadWallet', error)
    return res.redirect('/pageNotFound')
  }
}

const addTowallet = async (req, res) => {
  try {
    const { userId, amount } = req.body

    if (!userId || !amount || amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.INVALID_INPUT })
    }

    let wallet = await Wallet.findOne({ userId: userId })

    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: amount,
        transactions: [{ type: 'credit', amount, description: 'Wallet top-up' }]
      })
    } else {
      wallet.balance += amount
      wallet.transactions.push({ type: 'credit', amount, description: 'Wallet top-up' })
    }

    await wallet.save()
    res.status(StatusCodes.OK).json({ message: Messages.WALLET_RECHARGE_SUCCESS, wallet })
  } catch (error) {
    console.error('error occur while loadWallet', error)
    return res.redirect('/pageNotFound')
  }
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const createRazorpayOrder = async (req, res) => {
  try {
    const orderAmount = parseFloat(req.body.amount);
    if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.INVALID_AMOUNT });
    }

    console.log('orderAmount:', orderAmount);
    const order = await razorpayInstance.orders.create({
      amount: Math.round(orderAmount * 100), // Convert to paise
      currency: 'INR',
      payment_capture: 1,
    });
    console.log('order:', order);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
  }
};

const razorpayPaymentSuccess = async (req, res) => {
  try {
    const userId = req.session.user;
    const { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.INVALID_PAYMENT_SIGNATURE });
    }

    // Find and update wallet
    let wallet = await Wallet.findOne({ userId });
    const amountToAdd = parseFloat(amount);

    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: amountToAdd,
        transactions: [
          {
            type: 'credit',
            amount: amountToAdd,
            description: 'Wallet top-up',
            date: new Date(),
          },
        ],
      });
    } else {
      wallet.balance += amountToAdd;
      wallet.transactions.push({
        type: 'credit',
        amount: amountToAdd,
        description: 'Wallet top-up',
        date: new Date(),
      });
    }

    await wallet.save();

    return res.json({ success: true, newBalance: wallet.balance });
  } catch (error) {
    console.error('Error in payment success:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
  }
};

module.exports = {
  loadwallet,
  addTowallet,
  createRazorpayOrder,
  razorpayPaymentSuccess
}