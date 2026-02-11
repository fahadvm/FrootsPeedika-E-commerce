const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");



const Cart = require("../../models/cartSchema");

const productDetails = async (req, res) => {

  try {

    const userId = req.session.user;
    const userData = await User.findById(userId);
    const productId = req.query.id;
    const product = await Product.findById(productId).populate('category')
    const findCategory = product.category;
    const categoryOffer = findCategory?.categoryOffer || 0;
    const productOffer = product.productOffer || 0;

    const totalOffer = categoryOffer + productOffer;

    const categories = await Category.find({ isListed: true });

    // Check if product is in cart
    let isInCart = false;
    if (userId) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        isInCart = cart.items.some(item => item.productId.toString() === productId);
      }
    }

    const products = await Product.find({
      isBlocked: false,
      category: findCategory?._id,
      _id: { $ne: productId },
      stock: { $gt: 0 },
    })
      .sort({ createdOn: -1 })
      .limit(4);

    res.render("user/product-details", {
      user: userData,
      product: product,
      products: products,
      quantity: product.quantity,
      totalOffer: totalOffer,
      category: findCategory,
      isInCart: isInCart
    })
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.redirect('/404');
  }
};


module.exports = {
  productDetails
}
