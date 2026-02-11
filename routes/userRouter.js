const express = require('express')
const router = express.Router()

const usercontroller = require("../controllers/user/usercontroller")
const productController = require("../controllers/user/productController")
const addressController = require("../controllers/user/AddressController")
const wishlistController = require("../controllers/user/wishlistController")
const cartController = require("../controllers/user/cartController")
const checkoutController = require("../controllers/user/checkoutController")
const orderController = require("../controllers/user/orderController")
const walletController = require("../controllers/user/walletController")
const walletController1 = require("../controllers/user/walletController1")
const couponController = require('../controllers/user/couponController')
const contactcontroller = require('../controllers/user/contactcontroller')
const Coupon = require("../models/couponSchema")
const Address = require("../models/addressSchema")
const Order = require("../models/orderSchema")








const { userAuth } = require('../middlewares/auth');
const { resetPasswordMiddleware, blockLoggedInUsers, checkBlockedUser } = require("../middlewares/profileAuth")
const profileController = require('../controllers/user/profileController')
const passport = require('passport')
const multer = require("multer");
const path = require('path')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', checkBlockedUser, usercontroller.loadHomepage)
router.get('/pageNotFound', usercontroller.pageNotFound)
router.get('/signup', usercontroller.loadsignup)
router.post('/signup', usercontroller.signup)
router.get('/login', usercontroller.loadlogin)
router.post('/login', usercontroller.login)
router.post('/verify-otp', usercontroller.verifyOtp)
router.post('/resend-otp', usercontroller.resendOtp)
router.get('/logout', usercontroller.logout)

router.get("/forgot-password", blockLoggedInUsers, profileController.getForgotPassPage)
router.post("/forgot-email-valid", blockLoggedInUsers, profileController.forgotEmailValid)
router.post("/verify-passForgot-otp", blockLoggedInUsers, profileController.verifyForgotPassOtp)
router.get("/reset-password", resetPasswordMiddleware, profileController.getResetPassPage)
router.post("/resend-forgot-otp", blockLoggedInUsers, profileController.resendOtp);
router.post("/reset-password", resetPasswordMiddleware, profileController.postNewPassword);

router.get("/userProfile", userAuth, profileController.userProfile)
router.get("/editProfile", userAuth, profileController.loadeditprofile)
router.post("/editProfile", userAuth, upload.fields([{ name: 'image', maxCount: 1 }]), profileController.editprofile)

router.get('/change-email', userAuth, profileController.changeEmail)
router.post('/change-email', profileController.changeEmailValid)
router.post('/change-email-otp', profileController.verifyemailOtp)
router.get('/reset-email', userAuth, profileController.getresetemailpage)
router.post("/reset-email", resetPasswordMiddleware, profileController.postNewEmail);

router.get('/change-password', userAuth, profileController.changePassword)
router.post('/change-password', profileController.changePassEmailValid)
router.post('/change-password-otp', profileController.verifypassemailOtp)
router.get('/new-password', userAuth, profileController.getnewpasspage)
router.post("/new-password", resetPasswordMiddleware, profileController.NewPassword);

//address management
router.get('/address', userAuth, addressController.loadAddress)
router.post('/add-address', addressController.postAddress)
router.post('/editAddress', addressController.editAddress)
router.post('/delete-address/:id', addressController.deleteAddress)
router.post('/set-default-address', addressController.setPrimaryAddress)


// whishlist management
router.get("/wishlist", userAuth, wishlistController.loadWishlist)
router.patch("/addToWishlist", userAuth, wishlistController.addToWishlist)
router.delete("/removeFromWishList", userAuth, wishlistController.removeProduct)


//cart management

router.get('/cart', userAuth, cartController.loadCart)
router.post('/add-cart', cartController.addCart)
router.delete('/remove-cart/:id', userAuth, cartController.removeCart)
router.post('/update-cart-quantity', cartController.updatecartquantity)


//checkout management
router.get("/checkout", userAuth, checkoutController.loadCheckoutPage)
router.post("/placeOrder", userAuth, orderController.placeOrder);


//coupon mangement
router.get("/coupons", userAuth, couponController.loadcoupon)
router.post('/applycoupon', userAuth, couponController.applyCoupon)
router.get('/getAvailableCoupons', userAuth, couponController.getAvailableCoupons);
router.post('/clearCoupon', userAuth, couponController.clearCoupon);


router.get('/orders', userAuth, orderController.getOrder)
router.get("/order-details", userAuth, orderController.loadOrderDetails);
router.patch("/orders/cancel", userAuth, orderController.cancelOrder);
router.patch("/orders/return", userAuth, orderController.returnOrder);
router.get("/download-invoice", userAuth, orderController.generateInvoice);


router.post("/razorpay/create-order", orderController.createRazorpay)
router.post("/create-subscription", orderController.Razorpaysubscription)





router.get('/wallet', userAuth, walletController.getWallet)
router.post('/add-money', userAuth, walletController.addTowallet)
router.post("/wallet/create-order", userAuth, walletController.createRazorpayOrder)
router.post("/wallet/payment-success", userAuth, walletController.razorpayPaymentSuccess)






router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
    try {
        if (req.user.isBlocked) {
            req.logout((err) => {
                if (err) console.log("Logout error:", err);
                return res.render('user/login', { message: 'User is blocked by admin' });
            });
            return;
        }
        req.session.user = req.user._id;
        res.redirect('/');
    } catch (error) {
        console.log("Google login error:", error);
        res.redirect('/signup');
    }
});

router.get("/about", usercontroller.loadAboutpage);
router.get("/contact", contactcontroller.loadContactPage);




router.get("/shop", usercontroller.loadShoppingPage);
router.get("/shop1", usercontroller.loadShoppingPage1);
router.get("/productDetails", productController.productDetails);



module.exports = router
