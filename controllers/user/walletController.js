const Wallet = require("../../models/walletSchema");
const User = require('../../models/userSchema')
const Transaction = require("../../models/transactionSchema")
const Razorpay = require('razorpay');
const crypto = require("crypto")
const { TransactionType, TransactionStatus, PaymentMethod, PaymentGateway, StatusCodes, Messages } = require('../../helpers/constants');


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


const getWallet = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!userId) return res.status(StatusCodes.UNAUTHORIZED).send(Messages.UNAUTHORIZED);

    const user = await User.findById(userId);
    if (!user) return res.status(StatusCodes.NOT_FOUND).send(Messages.USER_NOT_FOUND);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    let wallet = await Wallet.findOne({ userId }).populate('userId', 'username email phone');
    if (!wallet) {
      wallet = new Wallet({ userId });
      await wallet.save();
    }

    // Calculate totals
    const totalCredit = wallet.transactions.reduce((sum, t) => t.type === TransactionType.CREDIT ? sum + t.amount : sum, 0);
    const totalDebit = wallet.transactions.reduce((sum, t) => t.type === TransactionType.DEBIT ? sum + t.amount : sum, 0);

    // Paginate transactions
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const paginatedTransactions = wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + limit);

    res.render('user/wallet', {
      wallet: {
        ...wallet.toObject(),
        transactions: paginatedTransactions,
        totalCredit,
        totalDebit
      },
      user,
      currentPage: page,
      totalPages,

    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Server Error: ${error.message}`);
  }
};

const getAllTransactions = async (req, res) => {
  const userId = req.session.user;

  // Validate user session
  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).render('error', { message: 'Please log in to view transactions' });
  }

  try {
    // Parse and validate query params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 5), 100); // Limit between 1-100

    // Fetch wallet with error handling
    const wallet = await Wallet.findOne({ userId }).lean();

    if (!wallet || !wallet.transactions) {
      return res.render('all-transactions', {
        transactions: [],
        currentPage: page,
        totalPages: 0,
        userId
      });
    }

    // Calculate pagination
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Ensure page doesn't exceed totalPages
    const validPage = Math.min(Math.max(1, page), totalPages || 1);

    // Get paginated transactions
    const transactions = wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice((validPage - 1) * limit, validPage * limit)
      .map(tx => ({
        ...tx,
        formattedDate: new Date(tx.date).toLocaleString() // Add formatted date for display
      }));

    // Render with additional useful info
    res.render('all-transactions', {
      transactions,
      currentPage: validPage,
      totalPages,
      hasNext: validPage < totalPages,
      hasPrev: validPage > 1,
      limit,
      userId
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).render('error', {
      message: 'Failed to load transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const addFundsPage = (req, res) => {
  res.render('user/add-funds'); // Render a page with amount input
};

const addFunds = async (req, res) => {
  const userId = req.session.user;

  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: Messages.NOT_FOUND });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.INTERNAL_SERVER_ERROR });
  }
};

const verifyPayment = async (req, res) => {
  const userId = req.session.user;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // Verify payment signature (implement proper verification)
    const crypto = require('crypto');
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.INVALID_PAYMENT_SIGNATURE });
    }

    // Update wallet
    const wallet = await Wallet.findOne({ userId });
    wallet.balance += amount / 100; // Convert paise to rupees
    wallet.transactions.push({
      description: 'Wallet Recharge',
      amount: amount / 100,
      type: TransactionType.DEPOSIT,
      referenceId: razorpay_payment_id,
      status: TransactionStatus.COMPLETED
    });
    await wallet.save();

    res.json({ message: Messages.PAYMENT_SUCCESS, wallet });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.INTERNAL_SERVER_ERROR });
  }
};


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
        transactions: [{ type: TransactionType.CREDIT, amount, description: 'Wallet top-up' }]
      })
    } else {
      wallet.balance += amount
      wallet.transactions.push({ type: TransactionType.CREDIT, amount, description: 'Wallet top-up' })
    }

    await wallet.save()
    res.status(StatusCodes.OK).json({ message: Messages.WALLET_RECHARGE_SUCCESS, wallet })
  } catch (error) {
    console.error('error occur while loadWallet', error)
    return res.redirect('/pageNotFound')
  }
}


const createRazorpayOrder = async (req, res) => {
  try {
    const orderAmount = parseFloat(req.body.amount);
    if (!orderAmount || isNaN(orderAmount) || orderAmount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.INVALID_AMOUNT });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100), // Convert to paise
      currency: 'INR',
      payment_capture: 1,
    });

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
            type: TransactionType.CREDIT,
            amount: amountToAdd,
            description: 'Wallet top-up',
            date: new Date(),
          },
        ],
      });
    } else {
      wallet.balance += amountToAdd;
      wallet.transactions.push({
        type: TransactionType.CREDIT,
        amount: amountToAdd,
        description: 'Wallet top-up',
        date: new Date(),
      });
    }

    await wallet.save();
    const transaction = new Transaction({
      userId,
      amount: amountToAdd,
      transactionType: TransactionType.CREDIT,
      paymentMethod: PaymentMethod.WALLET,
      purpose: "wallet_add",
      paymentGateway: PaymentGateway.RAZORPAY,
      description: "Wallet top-up",
      status: TransactionStatus.COMPLETED,
      walletBalanceAfter: wallet.balance,


    });
    await transaction.save();

    return res.json({ success: true, newBalance: wallet.balance });
  } catch (error) {
    console.error('Error in payment success:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
  }
};




module.exports = {
  getWallet,
  getAllTransactions,
  addFundsPage,
  addFunds,
  verifyPayment,
  addTowallet,
  createRazorpayOrder,
  razorpayPaymentSuccess

}