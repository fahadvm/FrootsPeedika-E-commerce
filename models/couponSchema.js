const mongoose = require('mongoose')
const {Schema} = mongoose

const couponSchema = new Schema({
  couponCode:{
    type:String,
    required:true,
    unique:true
  },
  createdOn:{
    type: Date,
    default: Date.now,
    required:true
  },
  expireOn:{
    type:Date,
    required:true
  },
  offerPrice:{
    type:Number,
    required:true
  },
  minPrice:{
    type:Number,
    required:true
  },
  maxPrice:{
    type:Number,
  },
  isList:{
    type:Boolean,
    default:false
  },
  users:[{
    type:Schema.Types.ObjectId,
    ref:"User"
  }]
})

const Coupon = mongoose.model("Coupon",couponSchema)
module.exports = Coupon