const Coupon = require('../../models/couponSchema')
const mongoose = require("mongoose")
const { StatusCodes, Messages } = require('../../helpers/constants');


const loadCoupon = async (req, res) => {
  try {
    const findCoupons = await Coupon.find({})
    return res.render('admin/coupon', { coupons: findCoupons })
  } catch (error) {
    console.error('eoor occur while loadCoupon')
    return res.redirect('pageerror')
  }
}

const createCoupon = async (req, res) => {
  try {
console.log("new coupon testing",req.body)
    const data = {
      couponCode: req.body.couponName,
      createdOn: new Date(req.body.startDate + 'T00:00:00'),
      expireOn: new Date(req.body.endDate + "T00:00:00"),
      offerPrice: parseInt(req.body.offerPrice),
      minPrice: parseInt(req.body.minimumPrice),
      maxPrice: parseInt(req.body.maximumPrice)
    }
    const newCoupon = new Coupon({
      couponCode: data.couponCode,
      createdOn: data.createdOn,
      expireOn: data.expireOn,
      offerPrice: data.offerPrice,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      users: []
    })

    await newCoupon.save()
    return res.redirect('/admin/coupon')
  } catch (error) {
    console.error('eoor occur while createCoupon', error)
    return res.redirect('pageerror')
  }
}




const editCoupon = async (req, res) => {
  try {

    const id = req.query.id;
    const findCoupon = await Coupon.findOne({ _id: id });

    res.render("admin/edit-coupon", {
      findCoupon: findCoupon,

    })

  } catch (error) {

    res.redirect("/pageerror")

  }
}

const updatecoupon = async (req, res) => {
  try {
    const couponId = req.query.couponId;
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: Messages.INVALID_COUPON_ID });
    }

    const oid = new mongoose.Types.ObjectId(couponId);
    const selectedCoupon = await Coupon.findOne({ _id: oid });

    if (!selectedCoupon) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: Messages.COUPON_NOT_FOUND });
    }

    const startDate = new Date(req.body.startDate + "T00:00:00");
    const endDate = new Date(req.body.endDate + "T00:00:00");

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      { _id: oid },
      {
        $set: {
          name: req.body.couponName,
          createdOn: startDate,
          expireOn: endDate,
          offerPrice: parseInt(req.body.offerPrice),
          minimumPrice: parseInt(req.body.minimumPrice)
        }
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.ERROR_UPDATING_COUPON });
    }

    res.json({ message: Messages.COUPON_UPDATED, coupon: updatedCoupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.INTERNAL_SERVER_ERROR });
  }
};

const deletecoupon = async (req, res) => {
  try {

    const id = req.query.id;
    await Coupon.deleteOne({ _id: id })
    res.status(StatusCodes.OK).send({ success: true, message: Messages.COUPON_DELETED })

  } catch (error) {
    console.error("Error Deleting Coupon", error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ success: false, message: Messages.INTERNAL_SERVER_ERROR })
  }
}

module.exports = {
  loadCoupon,
  createCoupon,
  deletecoupon,
  updatecoupon,
  editCoupon

}