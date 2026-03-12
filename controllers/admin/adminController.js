const User = require("../../models/userSchema")
const nodemailer = require("nodemailer")
const env = require('dotenv').config()
const bcrypt = require('bcrypt')
const Product = require("../../models/productSchema")
const Order = require("../../models/orderSchema")
const { OrderStatus, StatusCodes, Messages } = require('../../helpers/constants');



const pageError = async (req, res) => {
  res.render('admin/admin-error')
}
const loadLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect('/admin')
  }
  res.render('admin/login', { message: null })
}



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findadmin = await User.findOne({ isAdmin: 1, email: email });

    if (!findadmin) {
      return res.render('admin/login', { message: Messages.ADMIN_NOT_FOUND });
    }

    if (findadmin.isBlocked == true) {
      return res.render('admin/login', { message: Messages.ADMIN_BLOCKED });
    }

    const passwordMatch = await bcrypt.compare(password, findadmin.password);

    if (!passwordMatch) {
      return res.render('admin/login', { message: Messages.INCORRECT_PASSWORD });
    }

    req.session.admin = findadmin._id;
    console.log('in login session.admin:', req.session.admin)
    return res.redirect('/admin');
  } catch (error) {
    console.log('login error:', error);
    return res.render("admin/login", { message: Messages.LOGIN_FAILED });
  }
};


const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_SERVER_ERROR);
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect('/admin/login'); // Redirect to login
    });
  } catch (error) {
    console.log('Logout Error', error);
    res.redirect('/pageerror');
  }
};

const loadDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      const productCount = await Product.countDocuments()
      const userCount = await User.countDocuments({ isAdmin: false })
      const orderCount = await Order.countDocuments()
      const totalRevenue = await Order.aggregate([
        { $match: { status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] } } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } }
      ]).then(result => result[0]?.total || 0)
      const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5);



      const salesData = await getSalesDataHelper("monthly")
      const salesLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const orderStatusData = [
        await Order.countDocuments({ status: OrderStatus.DELIVERED }),
        await Order.countDocuments({ status: OrderStatus.PENDING }),
        await Order.countDocuments({ status: OrderStatus.SHIPPED }),
        await Order.countDocuments({ status: OrderStatus.RETURN_REQUEST }),
        await Order.countDocuments({ status: OrderStatus.RETURNED }),
        await Order.countDocuments({ status: OrderStatus.CANCELLED })
      ];

      const orderStatusLabels = ['Delivered', 'Pending', 'Shipped', 'Return Request', 'Returned', 'Cancelled']; // Using hardcoded labels for chart display as they are UI specific
      const dashboardData = {
        productCount,
        userCount,
        orderCount,
        totalRevenue,
        salesData: salesData.data,
        salesLabels: salesData.labels,
        orderStatusData,
        orderStatusLabels,
        recentOrders
      };

      res.render('admin/dashboard', { dashboardData });
    } catch (error) {
      res.redirect('/pageerror', error)
    }
  } else {
    return res.redirect('/admin/login')
  }
}


const getSalesDataHelper = async (period = "yearly") => {
  try {
    const now = new Date()
    const labels = []
    const data = []

    if (period === "weekly") {

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)

        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))

        const dayOrders = await Order.find({
          createdAt: { $gte: dayStart, $lte: dayEnd },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] },
        })

        const daySales = dayOrders.reduce((total, order) => total + order.finalAmount, 0)

        labels.push(date.toLocaleDateString("en-US", { weekday: "short" }))
        data.push(daySales)
      }
    } else if (period === "monthly") {

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

        const monthOrders = await Order.find({
          createdAt: { $gte: monthStart, $lte: monthEnd },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] },
        })

        const monthSales = monthOrders.reduce((total, order) => total + order.finalAmount, 0)

        labels.push(date.toLocaleDateString("en-US", { month: "short" }))
        data.push(monthSales)
      }
    } else if (period === "yearly") {

      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i

        const yearStart = new Date(year, 0, 1)
        const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

        const yearOrders = await Order.find({
          createdAt: { $gte: yearStart, $lte: yearEnd },
          status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] },
        })

        const yearSales = yearOrders.reduce((total, order) => total + order.finalAmount, 0)

        labels.push(year.toString())
        data.push(yearSales)
      }
    }

    return { labels, data }
  } catch (error) {
    console.error("Error getting sales data:", error)
    return { labels: [], data: [] }
  }
}

const getSalesData = async (req, res) => {
  try {
    const { period = "monthly" } = req.query
    console.log("period:", period)

    const salesData = await getSalesDataHelper(period)
    res.json(salesData)
  } catch (error) {
    console.error("Error in getSalesData API:", error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: Messages.INTERNAL_SERVER_ERROR })
  }
}


const getTopSelling = async (req, res) => {
  try {
    const { type } = req.query
    console.log('req.query:', req.query)

    if (type === "categories") {

      const topCategories = await Order.aggregate([
        { $match: { status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] } } },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        {
          $group: {
            _id: "$categoryDetails._id",
            name: { $first: "$categoryDetails.name" },
            productCount: { $addToSet: "$productDetails._id" },
            soldCount: { $sum: "$quantity" },
            totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            productCount: { $size: "$productCount" },
            soldCount: 1,
            totalSales: 1,
          },
        },
        { $sort: { soldCount: -1 } },
        { $limit: 10 },
      ])

      res.json({ categories: topCategories })
    } else {

      const topProducts = await Order.aggregate([
        { $match: { status: { $in: [OrderStatus.DELIVERED, OrderStatus.RETURN_REQUEST] } } },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product",
            name: { $first: "$productName" },
            soldCount: { $sum: "$quantity" },
            totalSales: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        { $sort: { soldCount: -1 } },
        { $limit: 10 },
      ])


      const enrichedProducts = await Promise.all(
        topProducts.map(async (product) => {
          const productDetails = await Product.findById(product._id).populate("category")
          return {
            _id: productDetails._id,
            name: productDetails.productName,
            category: productDetails?.category?.name || "Uncategorized",
            price: productDetails?.salePrice || 0,
            image: productDetails?.productImages?.[0] || null,
            soldCount: product.soldCount,
          }
        }),
      )
      console.log("enrichedProducts:", enrichedProducts)

      res.json({ products: enrichedProducts })
    }
  } catch (error) {
    console.error("Error in getTopSelling API:", error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: Messages.INTERNAL_SERVER_ERROR })
  }
}

module.exports = {
  login,
  loadLogin,
  loadDashboard,
  logout,
  pageError,
  getSalesData, getTopSelling
}