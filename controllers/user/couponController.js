const { StatusCodes, Messages } = require('../../helpers/constants');

const Coupon = require("../../models/couponSchema")
const User = require("../../models/userSchema")
const Cart = require("../../models/cartSchema")


function calculateShipping(prize) {
    if (prize < 100) {
        return 10;
    }
    return 0;
}


const loadcoupon = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const coupons = await Coupon.find({ users: { $nin: [userId] } });
        console.log("sending all of the coupons")

        res.render("user/coupon", {
            coupons,
            user: userData
        });

    } catch (error) {
        console.error("Error loading order details:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).render("error", { message: Messages.INTERNAL_SERVER_ERROR });
    }
};

const applyCoupon = async (req, res) => {
    try {

        console.log('apply coupon working here')
        const { couponCode } = req.body;
        const userId = req.session.user;

        // Validate coupon and calculate discount
        const coupon = await Coupon.findOne({
            couponCode: couponCode,
            users: { $nin: [userId] }
        });

        if (!coupon) {
            return res.json({ success: false, message: Messages.INVALID_COUPON_EXPIRED });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart) {
            return res.json({ success: false, message: Messages.CART_NOT_FOUND });
        }

        const cartItems = cart.items.filter(item => item.productId && !item.productId.isBlocked && item.productId.stock > 0);
        let subTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

        // Validate min and max price criteria
        if (subTotal < coupon.minPrice) {
            return res.json({ success: false, message: `Minimum purchase amount for this coupon is ₹${coupon.minPrice}` });
        }
        if (coupon.maxPrice && subTotal > coupon.maxPrice) {
            return res.json({ success: false, message: `Maximum purchase amount for this coupon is ₹${coupon.maxPrice}` });
        }

        const discountAmount = (subTotal * coupon.offerPrice) / 100;
        let discountedTotal = subTotal - discountAmount;
        let shipping = calculateShipping(subTotal);
        totalAmount = discountedTotal + shipping;
        await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } });

        return res.json({ success: true, totalAmount, discountAmount, shipping, subTotal });

    } catch (error) {
        console.error("Error applying coupon:", error);
        return res.json({ success: false, message: Messages.SOMETHING_WENT_WRONG });
    }
};

const clearCoupon = async (req, res) => {
    try {
        res.json({ success: true });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
    }
};

const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.session.user;
        const currentDate = new Date();

        const coupons = await Coupon.find({ isList: "false", users: { $ne: userId } });
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
    }
};



module.exports = {
    applyCoupon,
    clearCoupon,
    loadcoupon,
    getAvailableCoupons


}