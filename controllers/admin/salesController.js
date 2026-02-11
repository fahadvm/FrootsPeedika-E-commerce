const Sale = require("../../models/salesSchema");
const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const loadSalesPage = async (req, res) => {
  try {
    const { reportType, startDate, endDate, format } = req.query;
    let query = {};

    const now = new Date();
    switch (reportType) {
      case 'daily':
        query.createdAt = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lt: new Date(now.setHours(23, 59, 59, 999))
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        query.createdAt = {
          $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
          $lt: new Date(now)
        };
        break;
      case 'monthly':
        query.createdAt = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        };
        break;
      case 'custom':
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
          return res.status(400).render('admin/pageerror', { message: 'Invalid date range' });
        }
        query.createdAt = {
          $gte: new Date(startDate),
          $lt: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        };
        break;
      default:
        query.createdAt = { $exists: true }; // All time if no filter
    }

    query.status = { $in: ['delivered', 'return request'] };

    const orders = await Order.find(query).sort({ createdAt: 1 });
    let totalRegularPrice = 0;
    let totalFinalAmount = 0;

    const sales = orders.map(order => {
      const orderRegularPrice = order.totalPrice;
      const finalAmount = order.finalAmount;
      totalRegularPrice += orderRegularPrice;
      totalFinalAmount += finalAmount;


      return {
        orderId: order.orderId,
        amount: finalAmount,
        discount: order.discount || 0,
        coupon: order.couponApplied ? (order.totalPrice - order.finalAmount - (order.discount || 0)) : 0,
        lessPrice: orderRegularPrice - finalAmount,
        date: order.createdAt
      };
    });

    const salesData = {
      sales,
      totalSales: sales.reduce((sum, sale) => sum + sale.amount, 0),
      orderCount: sales.length,
      discounts: sales.reduce((sum, sale) => sum + sale.discount, 0),
      coupons: sales.reduce((sum, sale) => sum + sale.coupon, 0),
      lessPrices: totalRegularPrice - totalFinalAmount
    };

    if (format === 'pdf') {
      return generatePDF(res, salesData);
    } else if (format === 'excel') {
      return generateExcel(res, salesData);
    }

    res.render('admin/salesReport', { salesData });
  } catch (error) {
    console.error('Error in loadSalesPage:', error);
    res.status(500).render('admin/pageerror', {
      message: 'Error loading sales report',
      error: error.message
    });
  }
};


const generatePDF = async (res, salesData) => {
  const doc = new PDFDocument();


  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");

  doc.pipe(res);

  // Add content to PDF
  doc.fontSize(20).text("Sales Report", { align: "center" });
  doc.moveDown();

  // Add summary
  doc.fontSize(10).text("Summary");
  doc.fontSize(12)
    .text(`Total Sales: Rs. ${salesData.totalSales.toLocaleString()}`)
    .text(`Total Orders: ${salesData.orderCount}`)
    .text(`Total Discounts: Rs. ${salesData.discounts.toLocaleString()}`)
    .text(`Total Less Prices: Rs. ${salesData.lessPrices.toLocaleString()}`);

  doc.moveDown();


  doc.fontSize(14).text("Detailed Sales");
  let y = doc.y + 20;

  // Table headers
  const headers = ["Date", "Order ID", "Amount", "Discounts", "Coupons"];
  let x = 50;
  headers.forEach((header) => {
    doc.text(header, x, y);
    x += 100;
  });

  // Table rows
  y += 20;
  salesData.sales.forEach((sale) => {
    x = 50;
    doc.text(new Date(sale.date).toLocaleDateString(), x, y);
    x += 100;

    // Extract only the last 12 characters of orderId
    const shortOrderId = sale.orderId.toString().slice(-12);
    doc.text(shortOrderId, x, y);
    x += 100;

    doc.text(`Rs. ${sale.amount.toLocaleString()}`, x, y);
    x += 100;
    doc.text(`Rs. ${sale.discount.toLocaleString()}`, x, y);
    x += 100;
    doc.text(`Rs. ${sale.coupon.toLocaleString()}`, x, y);
  });

  doc.end();
};



const generateExcel = async (res, salesData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Add headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Order ID', key: 'orderId', width: 30 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Discounts', key: 'discount ', width: 15 },
    { header: 'Coupons', key: 'coupon', width: 15 }
  ];


  worksheet.addRow(['Summary']);
  worksheet.addRow(['Total Sales', '', `Rs. ${salesData.totalSales.toLocaleString()}`]);
  worksheet.addRow(['Total Orders', '', salesData.orderCount]);
  worksheet.addRow(['Total Discounts', '', `Rs. ${salesData.discounts.toLocaleString()}`]);
  worksheet.addRow(['Total Less Prices', '', `Rs. ${salesData.lessPrices.toLocaleString()}`]);
  worksheet.addRow([]);


  worksheet.addRow(['Detailed Sales']);
  salesData.sales.forEach(sale => {
    worksheet.addRow({
      date: new Date(sale.date).toLocaleDateString(),
      orderId: sale.orderId.toString(),
      amount: `Rs. ${sale.amount.toLocaleString()}`,
      lessPrice: `Rs. ${sale.lessPrice.toLocaleString()}`,
      discount: `Rs. ${sale.discount.toLocaleString()}`
    });
  });


  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

  await workbook.xlsx.write(res);
};



const createSaleRecord = async (order) => {
  try {
    const sale = new Sale({
      orderId: order._id,
      amount: order.totalAmount,
      discount: order.discount || 0,
      coupon: order.couponDiscount || 0,
      date: order.orderDate || new Date()
    });

    await sale.save();
    return sale;
  } catch (error) {
    console.error('Error creating sale record:', error);
    throw error;
  }
};


const loadSalesReports = async (req, res) => {
  try {
    res.render('admin/salesReport');
  } catch (error) {
    console.error('error occur while loadSalesReport', error)
    return res.redirect('/pageerror')
  }
}

const generateSalesReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: { $in: ['delivered', 'return request'] }
    }).populate('product');

    const summary = {
      salesCount: orders.length,
      orderAmount: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      discountAmount: orders.reduce((sum, order) => sum + order.discount, 0),
    };
    console.log("orders in generateSalesReport: ", orders)

    res.json({ success: true, orders, summary });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ success: false, message: "Error generating sales report" });
  }
};


module.exports = {
  loadSalesPage,
  createSaleRecord,
  generateSalesReports,
  loadSalesReports
};