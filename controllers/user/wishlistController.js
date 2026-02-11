const User = require("../../models/userSchema")
const Wishlist = require("../../models/whishlistSchema")
const Product = require("../../models/productSchema")
const Cart = require("../../models/cartSchema")

const loadWishlist = async (req, res) => {
    try {

        const userId = req.session.user;
        const user = await User.findById(userId);
        const products = await Product.find({ _id: { $in: user.wishlist } }).populate('category');
        const cart = await Cart.find({ userId: user._id })

        res.render("user/wishlist", {
            user,
            wishlist: products,
            cart

        })



    } catch (error) {
        console.error('Error loading wishlist:', error);
        res.redirect("/pageNotFound");
    }
}

const removeProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Use Mongoose pull to remove the item from the array
        user.wishlist.pull(productId);
        await user.save();

        return res.status(200).json({ success: true, message: "Item removed from wishlist" });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(200).json({ status: false, message: "User not authenticated" });
        }

        if (!productId) {
            return res.status(400).json({ status: false, message: "Invalid product ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(200).json({ status: false, message: "User not authenticated" });
        }

        user.wishlist = user.wishlist || [];

        // Check if product is already in wishlist using some() for ObjectId comparison
        const isAlreadyInWishlist = user.wishlist.some(id => id.toString() === productId);

        if (isAlreadyInWishlist) {
            return res.status(200).json({ status: false, message: "Product already in wishlist" });
        }

        user.wishlist.push(productId);
        await user.save();

        return res.status(200).json({ status: true, message: "Product added to wishlist" });
    } catch (error) {
        console.error("Error in addToWishlist:", error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};




module.exports = {
    loadWishlist,
    addToWishlist,
    removeProduct,



}