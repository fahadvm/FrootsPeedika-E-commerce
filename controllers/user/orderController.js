const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema")
const Coupon = require("../../models/couponSchema")
const Wallet = require("../../models/walletSchema")
const Transaction = require("../../models/transactionSchema")


const puppeteer = require("puppeteer")
const Razorpay = require("razorpay");
const path = require("path")
const ejs = require("ejs")
const fs = require("fs")



function calculateShipping(subtotal) {
    return subtotal > 100 ? 0 : 10;
}


const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})



const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod, totalAmountInput, discountAmount, couponCode } = req.body;

        const user = await User.findById(userId);
        const cartData = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            select: 'productName price salePrice productImages stock category isBlocked',
            populate: { path: 'category', select: 'isListed' }
        });

        console.log("cartData:", cartData)

        if (!user || !cartData || cartData.items.length === 0) {
            req.flash('error', 'cart is empty ');
            return res.redirect('/checkout');
        }

        // Validate user address
        const userAddress = await Address.findOne({ userId });
        if (!userAddress) {
            req.flash('error', ' address not found');
            return res.redirect('/checkout');
        }


        const selectedAddress = userAddress.address.find(addr => addr._id.toString() === addressId);

        if (!selectedAddress) {
            req.flash('error', 'Invalid address ');
            return res.redirect('/checkout');
        }

        const cartTotalBeforeDiscount = cartData.items.reduce((sum, item) => {
            return sum + (item.productId.salePrice * item.quantity);
        }, 0);

        // Validate all products and categories before proceeding
        for (const item of cartData.items) {
            if (!item.productId) {
                req.flash('error', 'One or more products in your cart are no longer available.');
                return res.redirect('/cart');
            }
            if (item.productId.isBlocked) {
                req.flash('error', `Product "${item.productId.productName}" is currently unavailable.`);
                return res.redirect('/cart');
            }
            if (!item.productId.category || !item.productId.category.isListed) {
                req.flash('error', `Category for "${item.productId.productName}" is currently unavailable.`);
                return res.redirect('/cart');
            }
            if (item.productId.stock < item.quantity) {
                req.flash('error', `Insufficient stock for "${item.productId.productName}". Available: ${item.productId.stock}`);
                return res.redirect('/cart');
            }
        }

        const shippingCharge = cartTotalBeforeDiscount < 100 ? 10 : 0;
        let totalAmount = shippingCharge;
        const orderItems = [];
        const orders = [];

        for (const item of cartData.items) {
            const subtotal = item.productId.salePrice * item.quantity;
            const itemDiscount = discountAmount
                ? (subtotal / cartTotalBeforeDiscount) * discountAmount
                : 0;
            const discountedSubtotal = subtotal - itemDiscount;
            const finalAmount = Math.max(0, discountedSubtotal);

            const order = new Order({
                userId,
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice,
                totalPrice: subtotal,
                discount: itemDiscount,
                finalAmount,
                discountedPrice: discountedSubtotal,
                address: selectedAddress,
                createdOn: new Date(),
                paymentMethod,
                couponCode: couponCode || null,
                productName: item.productId.productName,
                productImages: item.productId.productImages[0],
                status: (paymentMethod === 'cod') ? 'confirmed' : 'pending' // Online payments stay pending until verified
            });

            orderItems.push({
                name: item.productId.productName,
                price: item.productId.salePrice,
                quantity: item.quantity,
                discount: itemDiscount,
                finalPrice: finalAmount / item.quantity,
                discountedUnitPrice: discountedSubtotal / item.quantity
            });

            totalAmount += finalAmount;
            orders.push(order);
        }

        // Final check for wallet balance if chosen
        let wallet;
        if (paymentMethod === 'wallet') {
            wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < totalAmountInput) {
                req.flash('error', 'Insufficient wallet balance');
                return res.redirect('/checkout');
            }
        }

        // Process stock update and save orders
        for (const item of cartData.items) {
            await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
        }

        const savedOrders = await Promise.all(orders.map(order => order.save()));

        if (paymentMethod === 'wallet') {
            wallet.balance -= totalAmountInput;
            wallet.totalDebited += totalAmountInput;
            wallet.transactions.push({
                amount: totalAmountInput,
                type: 'debit',
                transactionPurpose: 'purchase',
                description: 'Order payment from wallet',
            });

            await wallet.save();

            await Transaction.create({
                userId,
                amount: totalAmountInput,
                transactionType: 'debit',
                paymentMethod: 'wallet',
                paymentGateway: 'wallet',
                status: 'completed',
                purpose: 'purchase',
                description: 'Order payment from wallet',
                orders: savedOrders.map(order => ({
                    name: order.productName,
                    quantity: order.quantity,
                    finalPrice: order.finalAmount
                })),
                orderIds: savedOrders.map(order => ({ orderId: order._id })),
                walletBalanceAfter: wallet.balance
            });
        }

        // Handle COD Payment
        if (paymentMethod === 'cod') {

            await Transaction.create({
                userId,
                amount: totalAmount,
                transactionType: 'debit',
                paymentMethod,
                paymentGateway: paymentMethod,
                status: 'pending',
                purpose: 'purchase',
                description: 'Order Payment',
                orders: savedOrders.map(order => ({
                    name: order.productName,
                    quantity: order.quantity,
                    finalPrice: order.finalAmount
                })),
                orderIds: savedOrders.map(order => ({ orderId: order._id }))
            });
        }

        // Handle Online Payment (like Net Banking)
        if (paymentMethod !== 'wallet' && paymentMethod !== 'cod') {

            await Transaction.create({
                userId,
                amount: totalAmount,
                transactionType: 'debit',
                paymentMethod: 'netbanking',
                paymentGateway: paymentMethod,
                status: 'completed',
                purpose: 'purchase',
                description: 'Order Payment',
                orders: savedOrders.map(order => ({
                    name: order.productName,
                    quantity: order.quantity,
                    finalPrice: order.finalAmount
                })),
                orderIds: savedOrders.map(order => ({ orderId: order._id }))
            });
        }

        // Prepare Aggregated Order Data
        const aggregatedOrder = {
            orderId: orders.length > 0 ? orders[0]._id : null,
            deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
            items: orderItems,
            total: totalAmount,
            appliedDiscount: Number(discountAmount) || 0,
            originalTotal: Number(totalAmount) + (Number(discountAmount) || 0),
            shippingCharge,
            couponCode: couponCode || null,
        };

        if (couponCode) {
            const couponData = await Coupon.findOne({ couponCode });
            if (couponData) {
                couponData.users.push(userId);
                await couponData.save();
            }
        }

        await Cart.updateOne({ userId }, { $set: { items: [] } });

        // Release lock
        if (user.checkoutSession) {
            user.checkoutSession.status = 'IDLE';
            await user.save();
        }

        res.render('user/order-success', { order: aggregatedOrder });

    } catch (error) {
        console.error('Error in placeOrder:', error);

        // Try to release lock even on error
        try {
            const user = await User.findById(req.session.user);
            if (user && user.checkoutSession) {
                user.checkoutSession.status = 'IDLE';
                await user.save();
            }
        } catch (releaseErr) {
            console.error("Error releasing lock on failure:", releaseErr);
        }

        req.flash('error', `${error.message}` || `Failed to place order`);
        return res.redirect('/checkout');

    }
};


const processReturn = async (orderId) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        // Refund calculation options:
        // Option 1: Refund discounted price without shipping
        const refundAmount = order.discountedPrice;

        // Option 2: Refund final amount including shipping (if shipping is refundable)
        // const refundAmount = order.finalAmount;

        // Option 3: Refund per unit price
        // const refundAmount = (order.discountedPrice / order.quantity) * quantityToReturn;

        // Update stock
        await Product.findByIdAndUpdate(order.product, { $inc: { stock: order.quantity } });

        return refundAmount;
    } catch (error) {
        console.error('Error in processReturn:', error);
        throw error;
    }
};

const getOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const limit = 5;
        const skip = (page - 1) * limit;

        const query = { userId: userId };
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: "i" } },
                { productName: { $regex: search, $options: "i" } }
            ];
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate({
                path: 'product',
                select: 'productName productImages salePrice'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const user = await User.findById(userId);

        res.render("user/orders", {
            orders: orders,
            user: user,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders: totalOrders,
            searchQuery: search
        });
    } catch (error) {
        console.error("Error in getOrders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const orderId = req.query.orderId;

        const user = await User.findById(userId);
        const order = await Order.findOne({
            orderId: orderId,
            userId: userId
        })
            .populate({
                path: 'product',
                select: 'productName productImages salePrice'
            });

        const addressid = order.address
        const addressData = await Address.findOne({ "address._id": addressid }, { "address.$": 1 })
        const address = addressData ? addressData.address[0] : null;


        if (!order) {
            return res.status(404).render("error", { message: "Order not found." });
        }

        res.render("user/order-details", {
            order: order,
            user: user,
            address: address,
        });

    } catch (error) {
        console.error("Error loading order details:", error);
        res.status(500).render("error", { message: "Internal server error." });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const orderData = await Order.findById(orderId);

        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (orderData.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled' });
        }

        // Restore product stock
        await Product.findByIdAndUpdate(orderData.product, {
            $inc: { stock: orderData.quantity }
        });

        // Refund to wallet if not COD
        if (orderData.paymentMethod !== 'cod') {
            let wallet = await Wallet.findOne({ userId: orderData.userId });

            if (!wallet) {
                wallet = new Wallet({
                    userId: orderData.userId,
                    balance: 0,
                    transactions: []
                });
            }

            const refundAmount = orderData.finalAmount;
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for cancelled order #${orderData.orderId}`,
            });

            await wallet.save();

            // Record transaction
            const transaction = new Transaction({
                userId: orderData.userId,
                amount: refundAmount,
                transactionType: "credit",
                paymentMethod: "wallet",
                paymentGateway: "wallet",
                status: "completed",
                purpose: "cancellation",
                description: `Order cancellation refund to wallet for #${orderData.orderId}`,
                orders: [{
                    name: orderData.productName,
                    price: orderData.price,
                    quantity: orderData.quantity,
                    finalPrice: orderData.finalAmount
                }],
                orderIds: [{ orderId: orderData._id }],
                walletBalanceAfter: wallet.balance,
            });
            await transaction.save();
        }

        orderData.status = 'cancelled';
        orderData.cancelReason = reason;
        await orderData.save();

        return res.json({ success: true, message: 'Order cancelled successfully' });

    } catch (error) {
        console.error('Error in cancelOrder:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}



const returnOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'delivered') {
            order.status = 'return request';
            order.returnReason = reason;

            const returnAmount = order.totalPrice;

            // await Product.findByIdAndUpdate(order.product, {
            //     $inc: { stock: order.quantity }
            // });

            // const wallet = await Wallet.findOne({ userId: order.userId, })

            // wallet.balance += order.finalAmount
            // wallet.transactions = [{ type: 'credit', amount:order.discountedPrice, description: 'returned amount' }]
            // await wallet.save()

            await order.save();
            res.json({ success: true, message: 'Order returned successfully' });
        } else {
            res.status(400).json({ success: false, message: 'Order cannot be returned' });
        }

    } catch (error) {
        console.error('Error in returnOrder:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};






const createRazorpay = async (req, res) => {
    try {
        const userId = req.session.user;
        const { amount, checkoutId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const now = new Date();
        const lockTimeout = 5 * 60 * 1000;

        // Check for existing lock
        if (user.checkoutSession &&
            user.checkoutSession.status === 'IN_PROGRESS' &&
            user.checkoutSession.lastUpdated &&
            (now - user.checkoutSession.lastUpdated) < lockTimeout) {
            return res.status(400).json({
                success: false,
                message: "A payment is already in progress in another tab. Please complete it or wait a few minutes."
            });
        }

        // Validate checkoutId
        if (checkoutId && user.checkoutSession.checkoutId !== checkoutId) {
            return res.status(400).json({
                success: false,
                message: "Checkout session expired. Please refresh the page."
            });
        }

        // Set the lock
        user.checkoutSession.status = 'IN_PROGRESS';
        user.checkoutSession.lastUpdated = now;
        await user.save();

        const order = await rzp.orders.create({
            amount: amount * 100, // Convert amount to paise
            currency: "INR",
            receipt: "receipt#" + (checkoutId || Date.now()),
            payment_capture: 1,
        });

        res.json({ success: true, order });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const releaseCheckoutLock = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (user && user.checkoutSession) {
            user.checkoutSession.status = 'IDLE';
            await user.save();
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error releasing checkout lock:", error);
        res.status(500).json({ success: false });
    }
};

const Razorpaysubscription = async (req, res) => {
    try {
        const { plan_id } = req.body; // Get Plan ID from frontend

        if (!plan_id) {
            return res.status(400).json({ success: false, message: "Plan ID is required" });
        }

        const subscriptionObject = {
            plan_id: plan_id,
            total_count: 60, // Number of billing cycles
            quantity: 1,
            customer_notify: 1,
            notes: {
                orderType: "Subscription"
            }
        };

        const subscription = await razorpay.subscriptions.create(subscriptionObject);

        res.json({ success: true, subscription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

        // Validate coupon and calculate discount
        const coupon = await Coupon.findOne({ couponCode: couponCode });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or expired coupon." });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart) {
            return res.json({ success: false, message: "Cart not found." });
        }

        const cartItems = cart.items.filter(item => item.productId && !item.productId.isBlocked && item.productId.stock > 0);
        let subTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const discountAmount = (subTotal * coupon.offerPrice) / 100;
        let discountedTotal = subTotal - discountAmount;
        let shipping = calculateShipping(discountedTotal);
        totalAmount = discountedTotal + shipping;
        await Coupon.updateOne({ _id: coupon._id }, { $inc: { usageCount: 1 } });

        return res.json({ success: true, totalAmount, discountAmount, shipping, subTotal });

    } catch (error) {
        console.error("Error applying coupon:", error);
        return res.json({ success: false, message: "Something went wrong." });
    }
};




const removeCoupon = async (req, res) => {
    try {
        req.session.appliedCoupon = null; // Remove applied coupon
        res.json({ success: true, message: "Coupon removed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error removing coupon" });
    }
};

const generateInvoice = async (req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.query.orderId

        const order = await Order.findOne({ orderId: orderId, userId }).populate({
            path: 'product',
            select: 'productName price salePrice productImages stock category isBlocked',
        });
        if (!order) {
            return res.status(404).send("Order not found")
        }

        if (order.status !== "delivered") {
            return res.status(400).send("Invoice is only available for delivered orders")
        }

        if (!order.invoiceDate) {
            order.invoiceDate = new Date()
            await order.save()
        }




        const templatePath = path.join(__dirname, "../../views/user/invoice-template.ejs")
        const html = await ejs.renderFile(templatePath, { order })

        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()

        // Set content and generate PDF
        await page.setContent(html, { waitUntil: "networkidle0" })

        // Create directory if it doesn't exist
        const invoiceDir = path.join(__dirname, "../../public/invoices")
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir, { recursive: true })
        }

        // Generate PDF file name
        const fileName = `invoice-${order.orderId}.pdf`
        const filePath = path.join(invoiceDir, fileName)

        // Generate PDF
        await page.pdf({
            path: filePath,
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        })

        await browser.close()

        // Send the PDF file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error sending file:", err)
                res.status(500).send("Error generating invoice")
            }

            // Optionally delete the file after sending
            // fs.unlinkSync(filePath);
        })
    } catch (error) {
        console.error("Error generating invoice:", error)
        res.status(500).send("Error generating invoice")
    }
}













module.exports = {
    placeOrder,
    getOrder,
    loadOrderDetails,
    cancelOrder,
    returnOrder,
    createRazorpay,
    releaseCheckoutLock,
    Razorpaysubscription,
    removeCoupon,
    generateInvoice


}