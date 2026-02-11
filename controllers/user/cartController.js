
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema")





function calculateShipping(subtotal) {
    // Free shipping over $100, $10 otherwise
    if (subtotal > 100) {
        return 0;
    } else {
        return 10;
    }
}


const loadCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const cartData = await Cart.findOne({ userId: userId }).populate({
            path: 'items.productId',
            select: 'productName price salePrice productImages stock isBlocked category',
            populate: {
                path: 'category',
                select: 'isListed'
            }
        });
        let warningMessage = null;

        if (cartData) {
            const originalItemCount = cartData.items.length;
            const validItems = [];
            const removedItems = [];

            cartData.items.forEach(item => {
                const product = item.productId;
                if (product && !product.isBlocked && product.stock > 0 && product.category?.isListed) {
                    validItems.push(item);
                } else {
                    if (product) {
                        removedItems.push(product.productName);
                    }
                }
            });

            if (removedItems.length > 0) {
                cartData.items = validItems;
                await cartData.save(); // Persist the removal
                warningMessage = `Some items were removed from your cart because they are no longer available: ${removedItems.join(', ')}`;
            }
        }


        if (!userData) {
            return res.redirect("/login")
        }

        let subtotal = 0
        if (cartData && cartData.items) {
            subtotal = cartData.items.reduce((sum, item) => sum + item.totalPrice, 0);
        }
        const shipping = calculateShipping(subtotal);
        const total = subtotal + shipping;



        return res.render("user/cart", {
            user: userData,
            cartItems: cartData,
            subtotal: subtotal,
            shipping: shipping,
            total: total,
            warningMessage: warningMessage
        });

    } catch (error) {
        return res.redirect("/pageNotFound")
    }

}


const addCart = async (req, res) => {
    console.log('addto cart is working')
    try {
        const { productId } = req.body;
        const quantity = 1;

        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        const userData = await User.findById(userId);
        const productData = await Product.findById(productId);


        if (!productData) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const price = productData.salePrice;

        const totalPrice = price * quantity;

        let userCart = await Cart.findOne({ userId: userData._id });

        if (!userCart) {
            userCart = new Cart({
                userId: userData._id,
                items: [{ productId, quantity, price, totalPrice }]
            });
        } else {
            const existingProduct = userCart.items.find(item => item.productId.toString() === productId);

            if (existingProduct) {
                const newQuantity = existingProduct.quantity + 1;

                if (newQuantity > 5) {
                    return res.json({ success: false, error: "max_limit" });
                }
                if (newQuantity > productData.stock) {
                    return res.json({ success: false, error: "out_of_stock" });
                }
                existingProduct.quantity = newQuantity;

                existingProduct.totalPrice = existingProduct.quantity * existingProduct.price;
            } else {
                userCart.items.push({ productId, quantity, price, totalPrice });
            }
        }

        await userCart.save();

        res.json({ success: true, message: "Product added to cart", cart: userCart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




const removeCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" }); // Or redirect
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" }); // Or redirect
        }

        // Use filter to create a new items array without the product to remove
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        await cart.save();

        // Respond with success or redirect
        // Respond with success
        res.json({ success: true, message: "Product removed from cart" });

    } catch (error) {
        console.error("Error removing from cart:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" }); // Or redirect
    }
};

const updatecartquantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body; // Get productId and quantity from request body
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        // --- Crucial Updates ---
        const parsedQuantity = parseInt(quantity); // Parse quantity as an integer

        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }

        if (parsedQuantity > 5) {
            return res.status(400).json({ success: false, message: "Maximum quantity is 5 per product" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        if (parsedQuantity > product.stock) {
            return res.status(400).json({ success: false, message: `Only ${product.stock} items available in stock` });
        }

        cart.items[itemIndex].quantity = parsedQuantity; // Update the quantity in the cart item
        cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * cart.items[itemIndex].price; // Recalculate totalPrice

        await cart.save(); // Save the updated cart

        // --- Recalculate Totals ---
        let subtotal = 0;
        if (cart.items && cart.items.length > 0) { // Check if items array exists and is not empty
            subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        }

        const shipping = calculateShipping(subtotal); // Call your shipping calculation function
        const total = subtotal + shipping;
        const itemTotal = cart.items[itemIndex].totalPrice; // Updated total for the specific item

        res.json({ success: true, subtotal, shipping, total, itemTotal }); // Send back updated totals

    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


































module.exports = {
    loadCart,
    addCart,
    removeCart,
    updatecartquantity

}