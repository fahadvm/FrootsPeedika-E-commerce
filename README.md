# 🍎 Froots Peedika - Premium E-commerce Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
[![Framework](https://img.shields.io/badge/framework-Express-blue)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB-green)](https://www.mongodb.com/)

**Froots Peedika** is a robust, full-featured E-commerce application specialized for fresh produce and fruits. Built with the PERN (Express, EJS, Node) stack, it offers a seamless shopping experience for users and a powerful management dashboard for administrators.

---

## 🌟 Key Features

### 👤 User Side
- **Authentication**: Secure login/signup with email/password and **Google OAuth** integration.
- **Product Discovery**: Browse products by categories, search functionality, and detailed product pages.
- **Cart & Wishlist**: Manage items you want to buy now or save for later.
- **Wallet System**: Integrated wallet for quick payments and refunds.
- **Checkout Flow**: Multiple address management and secure checkout.
- **Payments**: Integrated **Razorpay** for seamless online transactions.
- **Order Management**: Track order status, view order history, and download **PDF Invoices**.
- **Coupons & Offers**: Apply discount coupons and view product/category offers.

### 🛡️ Admin Dashboard
- **Sales Analytics**: Visual representation of sales data with custom date range filtering.
- **Inventory Management**: Full CRUD operations for products and categories.
- **Order Control**: Manage user orders, status updates (Pending, Shipped, Delivered, Cancelled).
- **User Management**: Block/Unblock users and manage user accounts.
- **Coupon Management**: Create and manage discount coupons to boost sales.
- **Reports**: Generate and download comprehensive sales reports in **Excel** and **PDF** formats.

---

## 🛠️ Technologies Used

### Frontend
- **Templating Engine**: EJS (Embedded JavaScript)
- **Styling**: Custom CSS3, Responsive Design
- **Interactions**: Vanilla JavaScript / Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: Passport.js (Local & Google Strategy), Bcrypt
- **Image Processing**: Multer & Sharp (for optimized product images)

### Database
- **Primary Database**: MongoDB
- **ODM**: Mongoose

### Tools & Libraries
- **Payments**: Razorpay API
- **Reporting**: PDFKit (Invoices/PDF Reports), ExcelJS (Excel Exports)
- **Mailing**: Nodemailer (OTP and Order confirmations)
- **Utilities**: UUID, Crypto, Dotenv

---

## 📂 Folder Structure

```text
├── config/             # Database & Passport configurations
├── controllers/        # Business logic for all routes (Admin & User)
├── helpers/            # Reusable utility functions (Handlebars/EJS helpers)
├── middlewares/        # Custom middlewares (Auth, Error handling)
├── models/             # Mongoose schemas (User, Product, Order, etc.)
├── public/             # Static assets (Images, CSS, JS)
├── routes/             # Route definitions (adminRouter, userRouter)
├── uploads/            # Product image storage
├── views/              # EJS templates for all pages
├── app.js              # Entry point of the application
└── .env                # Environment variables
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (Local or Atlas)
- Razorpay Account (for testing payments)

### Step-by-Step Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/froots-peedika.git
   cd froots-peedika
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3007
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_secret_key
   
   # Email Configuration
   NODEMAILER_EMAIL=your_email@gmail.com
   NODEMAILER_PASSWORD=your_app_password
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Run the application**
   ```bash
   # Using nodemon for development
   npm start
   ```

---

## 🚀 API Endpoints (Quick Reference)

### User Routes
- `GET /` - Home Page
- `GET /shop` - Product Listing
- `GET /cart` - User Cart
- `POST /add-to-cart/:id` - Add product to cart
- `GET /checkout` - Checkout Page

### Admin Routes
- `GET /admin/login` - Admin Authentication
- `GET /admin/dashboard` - Main Dashboard
- `GET /admin/products` - Product Management
- `GET /admin/orders` - Order Tracking

---

## 📸 Screenshots
*(Add your project screenshots here to showcase your beautiful UI!)*

| Home Page | Admin Dashboard |
|-----------|------------------|
| ![Home Placeholder](https://via.placeholder.com/400x250?text=Home+Page+Preview) | ![Admin Placeholder](https://via.placeholder.com/400x250?text=Admin+Dashboard+Preview) |

---

## 💡 Key Learnings & Highlights
- **Complex State Management**: Handled complex shopping cart logic and inventory synchronization.
- **Secure Payments**: Gained deep understanding of Webhook handling and secure transaction flows with Razorpay.
- **Dynamic Reporting**: Implemented server-side PDF and Excel generation for business analytics.
- **OAuth Integration**: Successfully integrated third-party authentication for better user onboarding.

---

## 🔗 Live Demo
[View Live Project](https://froots-peedika.onrender.com) *(Update this if you have a live link)*

---

## 📄 License
This project is licensed under the ISC License.

---
Developed with ❤️ by [Fahad](https://github.com/fahadvm)
