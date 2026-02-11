const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true })
    res.render("admin/product-add", {
      cat: category,
    })
  } catch (error) {
    console.error("Error loading product add page:", error)
    res.status(500).json({ success: false, message: "Error loading product add page" })
  }
}


const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 4;

    const productData = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
      ]
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("category")  // Ensure population of category
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
      ]
    }).countDocuments();

    const category = await Category.find({ isListed: true });

    if (category) {
      res.render("admin/products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        search: search,
      });
    } else {
      res.render("admin-error");
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    res.render("admin-error");
  }
};




const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;
    const product = await Product.findById(productId).populate('category');

    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    const productOffer = parseInt(percentage);
    const categoryOffer = product.category ? product.category.categoryOffer : 0;
    const bestOffer = Math.max(productOffer, categoryOffer);

    product.productOffer = productOffer;
    product.salePrice = Math.round(product.regularPrice * (1 - bestOffer / 100));
    await product.save();

    res.json({ status: true, message: "Offer added successfully" });

  } catch (error) {
    console.error("Error in addProductOffer:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId).populate('category');

    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    const categoryOffer = product.category ? product.category.categoryOffer : 0;

    product.productOffer = 0;
    product.salePrice = Math.round(product.regularPrice * (1 - categoryOffer / 100));
    await product.save();

    res.json({ status: true, message: "Offer removed successfully" });
  } catch (error) {
    console.error("Error in removeProductOffer:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

const blockProduct = async (req, res) => {
  try {

    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/products")

  } catch (error) {
    res.redirect("/pageerror")

  }
}

const unblockProduct = async (req, res) => {
  try {

    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products")

  } catch (error) {
    res.redirect("/pageerror")

  }
}

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id
    const product = await Product.findOne({ _id: id }).populate("category")
    const categories = await Category.find({})

    if (!product) {
      return res.status(404).send("Product not found")
    }

    res.render("admin/product-edit", {
      product: product,
      cat: categories,
    })
  } catch (error) {
    console.error("Error in getEditProduct:", error)
    res.redirect("/pageerror")
  }
}



const editProduct = async (req, res) => {
  try {
    // const id = req.params.id
    // const {
    //   productName,
    //   description,
    //   fullDescription,
    //   regularPrice,
    //   salePrice,
    //   quantity,
    //   color,
    //   brand,
    //   processor,
    //   graphicsCard,
    //   storages,
    //   display,
    //   operatingSystem,
    //   boxContains,
    //   category,
    // } = req.body

    // const existingProduct = await Product.findOne({
    //   productName: productName,
    //   _id: { $ne: id },
    // })

    // if (existingProduct) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Product with this name already exists. Please try another name." })
    // }

    // const updateFields = {
    //   productName,
    //   description,
    //   fullDescription,
    //   regularPrice,
    //   salePrice,
    //   quantity,
    //   color,
    //   brand,
    //   processor,
    //   graphicsCard,
    //   storages,
    //   display,
    //   operatingSystem,
    //   boxContains,
    //   category,
    // }

    const id = req.params.id;
    const {
      productName,
      shortDescription,
      nutritionalInfo,
      weightSize,
      regularPrice,
      salePrice,
      stock,
      organic,
      expirationDate,
      importedLocal,
      freshFrozen,
      category,
      status,
    } = req.body;

    // Check if product with the same name already exists (excluding the current product)
    const existingProduct = await Product.findOne({
      productName: productName,
      _id: { $ne: id },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists. Please try another name.",
      });
    }

    // Find the product by ID
    // const product = await Product.findById(id);
    // if (!product) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Product not found",
    //   });
    // }

    // Update product fields
    const updateFields = {
      productName,
      shortDescription,
      nutritionalInfo,
      weightSize,
      regularPrice,
      salePrice,
      stock,
      organic,
      expirationDate,
      importedLocal,
      freshFrozen,
      category,
      status,
    };

    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" })
    }

    // Handle image updates with cropped data
    for (let i = 1; i <= 4; i++) {
      const croppedImageData = req.body[`croppedImage${i}`];

      if (croppedImageData && croppedImageData.startsWith('data:image')) {
        // Extract base64 data from the data URL
        const base64Data = croppedImageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const filename = Date.now() + "-" + `cropped-image-${i}` + ".webp";
        const filepath = path.join(__dirname, "../../public/uploads/product-images", filename);

        // Save the cropped image
        await sharp(imageBuffer)
          .webp({ quality: 80 })
          .toFile(filepath);

        const imagePath = `uploads/product-images/${filename}`;

        // Update product image array
        if (product.productImages[i - 1]) {
          product.productImages[i - 1] = imagePath;
        } else {
          product.productImages.push(imagePath);
        }
      } else if (req.files && req.files[`image${i}`]) {
        // Fallback to original file handling if no cropped data
        const file = req.files[`image${i}`][0];
        const filename = Date.now() + "-" + file.originalname.replace(/\s/g, "") + ".webp";
        const filepath = path.join(__dirname, "../../public/uploads/product-images", filename);

        await sharp(file.buffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);

        const imagePath = `uploads/product-images/${filename}`;

        if (product.productImages[i - 1]) {
          product.productImages[i - 1] = imagePath;
        } else {
          product.productImages.push(imagePath);
        }
      }
    }

    Object.assign(product, updateFields);
    await product.save();

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Error in editProduct:", error);
    res.status(500).json({ success: false, message: "An error occurred while updating the product" });
  }
};






const editProduct1 = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      productName,
      shortDescription,
      nutritionalInfo,
      weightSize,
      regularPrice,
      salePrice,
      stock,
      organic,
      expirationDate,
      importedLocal,
      freshFrozen,
      category,
      status,
    } = req.body;

    // Check if product with the same name already exists (excluding the current product)
    const existingProduct = await Product.findOne({
      productName: productName,
      _id: { $ne: id },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "Product with this name already exists. Please try another name.",
      });
    }

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update product fields
    const updateFields = {
      productName,
      shortDescription,
      nutritionalInfo,
      weightSize,
      regularPrice,
      salePrice,
      stock,
      organic,
      expirationDate,
      importedLocal,
      freshFrozen,
      category,
      status,
    };

    // Handle image updates
    if (req.files) {
      // Ensure product.productImages is an array
      if (!Array.isArray(product.productImages)) {
        product.productImages = [];
      }

      for (let i = 1; i <= 4; i++) {
        if (req.files[`image${i}`]) {
          const file = req.files[`image${i}`][0];
          const filename = `${Date.now()}-${file.originalname.replace(/\s/g, "")}`;
          const filepath = path.join(
            __dirname,
            "../../public/uploads/product-images",
            filename
          );

          // Resize and save the image using sharp
          await sharp(file.buffer)
            .resize(800, 800, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);

          const imagePath = `uploads/product-images/${filename}`;

          // Update or add the image to the product
          if (product.productImages[i - 1]) {
            product.productImages[i - 1] = imagePath; // Replace existing image
          } else {
            product.productImages.push(imagePath); // Add new image
          }
        }
      }
    }

    // Assign updated fields to the product
    Object.assign(product, updateFields);

    // Save the updated product
    await product.save();

    // Send a JSON response for frontend handling
    res.redirect("/admin/products")
  } catch (error) {
    console.error("Error in editProduct:", error);

    // Send a JSON response for errors
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the product",
    });
  }
};


const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer, imageIndex } = req.body;
    const product = await Product.findById(productIdToServer);

    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found" });
    }

    // Remove the image from the array
    product.productImages.splice(imageIndex, 1);
    await product.save();

    const imagePath = path.join(__dirname, "../../public", imageNameToServer);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted successfully`);
    } else {
      console.log(`Image ${imageNameToServer} not found`);
    }

    res.json({ status: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSingleImage:", error);
    res.status(500).json({ status: false, message: "An error occurred while deleting the image" });
  }
};



const deleteProduct = async (req, res) => {
  const productId = req.query.id;

  if (!productId) {
    return res.status(400).json({ status: false, message: 'Product ID is required' });
  }

  try {
    // Find and delete the product by its ID
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    res.redirect('/admin/products'); // Redirect to the products management page or wherever you want
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Server Error' });
  }
}










const saveImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Generate unique filename
    const filename = Date.now() + '-' + file.originalname.replace(/\s/g, "");
    const filepath = path.join(__dirname, "../../public/uploads/product-images", filename);

    // Resize & convert to WebP
    await sharp(file.buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    return res.status(200).json({ success: true, message: "Image saved successfully", filename });
  } catch (error) {
    console.error("Error saving image:", error);
    return res.status(500).json({ success: false, message: "Error saving image" });
  }
};


const addProducts = async (req, res) => {
  try {
    const { productName, shortDescription, nutritionalInfo, weightSize, regularPrice, salePrice, stock, organic, expirationDate, importedLocal, freshFrozen, category } = req.body;

    // Check if product already exists
    const productExists = await Product.findOne({ productName });
    if (productExists) {
      return res.status(400).json({ success: false, message: "Product already exists, try another name" });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../../public/uploads/product-images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process images - handle both cropped images and regular file uploads
    const imageFilenames = [];

    // Process cropped images first
    for (let i = 1; i <= 4; i++) {
      const croppedImageData = req.body[`croppedImage${i}`];

      if (croppedImageData && croppedImageData.startsWith('data:image')) {
        // Extract base64 data from the data URL
        const base64Data = croppedImageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const filename = Date.now() + "-" + `cropped-image-${i}` + ".webp";
        const filepath = path.join(uploadDir, filename);

        // Save the cropped image
        await sharp(imageBuffer)
          .webp({ quality: 80 })
          .toFile(filepath);

        imageFilenames.push(`uploads/product-images/${filename}`);
      } else if (req.files && req.files[`image${i}`]) {
        // Fallback to original file handling if no cropped data
        const file = req.files[`image${i}`][0];
        const filename = Date.now() + "-" + file.originalname.replace(/\s/g, "") + ".webp";
        const filepath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filepath);

        imageFilenames.push(`uploads/product-images/${filename}`);
      }
    }

    // Check if we have all required images
    if (imageFilenames.length < 4) {
      return res.status(400).json({ success: false, message: "Please upload all 4 product images" });
    }

    // Find category by name (ensure it exists)
    const foundCategory = await Category.findOne({ name: category });
    if (!foundCategory) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    // Create and save new product
    const newProduct = new Product({
      productName,
      shortDescription,
      nutritionalInfo,
      weightSize,
      regularPrice,
      salePrice: salePrice || regularPrice, // If sale price is not provided, use regular price
      stock,
      organic,
      expirationDate,
      importedLocal,
      freshFrozen,
      category: foundCategory._id,
      productImages: imageFilenames, // Array of image filenames
      status: 'Available',

    });
    await newProduct.save();
    return res.status(200).json({ success: true, message: "Product added successfully" });
  } catch (error) {
    console.error("Error saving product:", error);
    return res.status(500).json({ success: false, message: "Error saving product" });
  }
};

module.exports = {
  getProductAddPage,
  saveImage,
  addProducts,
  getAllProducts,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage,
  deleteProduct




}