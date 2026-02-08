const EventEmitter = require("events")
const userBlockedEmitter = new EventEmitter()
const User = require("../../models/userSchema");


const customerInfo = async (req, res) => {
    try {
      let search = req.query.search || '';
      console.log("req.body:",req.query)
      let page = parseInt(req.query.page) || 1;
      const limit = 3;
  
      const userData = await User.find({
        isAdmin: false,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      })
      .sort({ createdOn: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
  
      const count = await User.countDocuments({
        isAdmin: false,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
  
      res.render('admin/customers', {
        data: userData,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
  
    } catch (error) {
      console.error(error);
      res.redirect('/pageerror');
    }
  };
  

const customerBlocked = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, { isBlocked: true });
        res.status(200).json({ message: 'User blocked successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to block user' });
      }
  }

const customerUnblocked = async (req,res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndUpdate(userId, { isBlocked: false });
        res.status(200).json({ message: 'User unblocked successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Failed to unblock user' });
      }
}



module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
    userBlockedEmitter,
    

}