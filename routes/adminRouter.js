const express = require('express')
const router = express.Router()
const admincontroller = require("../controllers/admin/adminController")
const customerController = require("../controllers/admin/customerController")
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const orderController = require("../controllers/admin/orderController");
const couponController = require("../controllers/admin/couponController");
const salesController = require("../controllers/admin/salesController");
const transactionsController = require("../controllers/admin/transactionController");
const profileController = require("../controllers/admin/profileController")
 


const { adminAuth } = require('../middlewares/auth');
const multer = require("multer");
const upload = multer();




//  Admin Authentication
router.get('/login',admincontroller.loadLogin)
router.post('/login',admincontroller.login);
router.get('/', adminAuth, admincontroller.loadDashboard);
router.get('/logout',admincontroller.logout);
router.get('/pageerror', admincontroller.pageError);


router.get('/users', adminAuth, customerController.customerInfo);
router.patch('/customers/:id/block', adminAuth, customerController.customerBlocked);
router.patch('/customers/:id/unblock', adminAuth, customerController.customerUnblocked);




router.get("/Profile", adminAuth, profileController.loadprofile)
router.get("/edit-profile/:id", adminAuth, profileController.loadEditProfile)
router.put("/update-profile/:id", adminAuth,upload.single('profilePicture'), profileController.updateProfile)





router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addcategory',adminAuth,categoryController.addCategory)
router.patch('/addCategoryOffer', adminAuth,categoryController.addCategoryOffer);
router.put("/editCategoryOffer",adminAuth, categoryController.editCategoryOffer)
router.delete("/removeCategoryOffer",adminAuth, categoryController.removeCategoryOffer)
router.put('/editCategory/:id',adminAuth, categoryController.editCategory);
router.get('/listCategory',adminAuth,categoryController.getListCategory);
router.get('/unListCategory', adminAuth, categoryController.getUnlistCategory);
router.delete("/deleteCategory/:id",adminAuth, categoryController.deleteCategory)
router.put('/editCategory', adminAuth,categoryController.getEditCategory);


router.get("/addProducts",adminAuth,  productController.getProductAddPage);
router.post("/saveImage", adminAuth, upload.single('image'), productController.saveImage);
router.post("/addProducts",adminAuth,  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), productController.addProducts);


router.get("/products",adminAuth,productController.getAllProducts);
router.get("/products/:id", adminAuth, productController.getProductDetails);
router.patch("/addProductOffer",adminAuth,productController.addProductOffer);
router.delete("/removeProductOffer",adminAuth,productController.removeProductOffer);

router.get("/blockProduct",adminAuth,productController.blockProduct);
router.get("/unblockProduct",adminAuth,productController.unblockProduct);


router.get("/editProduct",adminAuth,productController.getEditProduct)
router.delete("/deleteImage",adminAuth,productController.deleteSingleImage)

router.put("/editProduct/:id", adminAuth,upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), productController.editProduct);



//order management

router.get('/orders', adminAuth, orderController.getOrders);
router.get('/orders/:id', adminAuth, orderController.getOrderDetails);
router.put('/orders/update-status', adminAuth, orderController.updateOrderStatus);
router.delete('/orders/cancel', adminAuth, orderController.cancelOrder);
router.post('/orders/handle-return',orderController.handleOrderReturn)



//coupon management
router.get('/coupon', adminAuth, couponController.loadCoupon);
router.post('/createCoupon',adminAuth, couponController.createCoupon)
router.delete('/deletecoupon',adminAuth, couponController.deletecoupon)
router.get('/editCoupon',adminAuth, couponController.editCoupon)
router.put('/updatecoupon',adminAuth, couponController.updatecoupon)



router.get('/salesReport',adminAuth,salesController.loadSalesReports)
router.post('/salesReport',salesController.generateSalesReports)

//transactions management
router.get('/transactions',adminAuth,transactionsController.loadtranactions)
router.get("/transactions/:transactionId", adminAuth,transactionsController.transactionDetails)



router.get("/api/top-selling", adminAuth, admincontroller.getTopSelling)
router.get("/api/sales-data", adminAuth, admincontroller.getSalesData)



module.exports = router;