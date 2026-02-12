const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema")

function calculateShipping(subtotal) {
    return subtotal > 100 ? 0 : 10;
}

// const loadCheckoutPage = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         if (!userId) return res.redirect('/login');

//         const userData = await User.findById(userId);
//         const addressData = await Address.findOne({ userId: userId });
//         const cartData = await Cart.findOne({ userId: userId }).populate({
//             path: 'items.productId',
//             select: 'productName price salePrice productImages stock category isBlocked',
//             populate: { path: 'category', select: 'isListed' }
//         });

//         if (!userData) return res.status(404).send("User not found");
//         if (!cartData || cartData.items.length === 0) return res.redirect('/cart');

//         const cartItems = cartData.items
//             .filter(item => item.productId && !item.productId.isBlocked && item.productId.category?.isListed)
//             .map(item => ({
//                 product: item.productId,
//                 quantity: item.quantity,
//                 totalPrice: item.productId.salePrice * item.quantity,
//             }));

//         let subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
//         let discount = 0;
//         let newTotal = subtotal;

//         // Check if a coupon is applied
//         if (req.session.appliedCoupon) {
//             discount = req.session.appliedCoupon.discount;
//             newTotal = req.session.appliedCoupon.newTotal;
//         }

//         const shipping = calculateShipping(subtotal);
//         const total = newTotal + shipping;

//         return res.render('user/checkout', {
//             user: userData,
//             cartItems,
//             subtotal,
//             discount,
//             shipping,
//             total,
//             addresses: addressData,
//             appliedCoupon: req.session.appliedCoupon ? req.session.appliedCoupon.name : null,
//             successMessage:undefined,

//         });

//     } catch (error) {
//         console.error("Error in loadCheckoutPage:", error);
//         return res.redirect("/pageNotFound");
//     }
// };

const loadCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: { path: 'category' }
        });
        const wallet = await Wallet.findOne({ userId });

        if (!cart || cart.items.length === 0) {
            return res.redirect('/shop');
        }

        const validItems = cart.items.filter(item =>
            item.productId &&
            !item.productId.isBlocked &&
            item.productId.stock >= item.quantity &&
            item.productId.category &&
            item.productId.category.isListed
        );

        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save();
            if (validItems.length === 0) {
                req.flash('error', 'Some items in your cart became unavailable.');
                return res.redirect('/cart');
            }
        }

        let subTotal = validItems.reduce((sum, item) => sum + item.totalPrice, 0);
        let shipping = calculateShipping(subTotal);
        let totalAmount = subTotal + shipping;

        const addressData = await Address.findOne({ userId });
        const addresses = addressData ? addressData : [];

        // Checkout Locking Logic
        const now = new Date();
        const lockTimeout = 5 * 60 * 1000; // 5 minutes
        let paymentInProgress = false;

        if (user.checkoutSession &&
            user.checkoutSession.status === 'IN_PROGRESS' &&
            user.checkoutSession.lastUpdated &&
            (now - user.checkoutSession.lastUpdated) < lockTimeout) {
            paymentInProgress = true;
        }

        const { v4: uuidv4 } = require('uuid');
        const checkoutId = uuidv4();

        // If not in progress or lock expired, update the session with a fresh ID but keep it IDLE
        if (!paymentInProgress) {
            user.checkoutSession = {
                checkoutId: checkoutId,
                status: 'IDLE',
                lastUpdated: now
            };
            await user.save();
        }

        res.render('user/checkout', {
            user,
            cartItems: validItems,
            subTotal,
            shipping,
            addresses,
            totalAmount,
            discount: 0,
            wallet,
            checkoutId: user.checkoutSession.checkoutId,
            paymentInProgress,
            razorpayKey: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error occurred while loading checkout:', error);
        return res.redirect('/pageNotFound');
    }
};


module.exports = {
    loadCheckoutPage
};
