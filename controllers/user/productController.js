const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");



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
    const categoryIds = categories.map(category => category._id.toString());

    const products = await Product.find({
      isBlocked: false,
      category: { $in: categoryIds },
      stock: { $gt: 0 },
    })
      .sort({ createdOn: -1 })
      .skip(0)
      .limit(9);

    res.render("user/product-details", {
      user: userData,
      product: product,
      products: products,
      quantity: product.quantity,
      totalOffer: totalOffer,
      category: findCategory
    })
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.redirect('/404');
  }
};


module.exports = {
  productDetails
}
