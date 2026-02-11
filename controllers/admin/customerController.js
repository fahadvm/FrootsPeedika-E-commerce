const EventEmitter = require("events")
const userBlockedEmitter = new EventEmitter()
const User = require("../../models/userSchema");


const customerInfo = async (req, res) => {
  try {
    let search = req.query.search || req.query.q || '';
    let page = parseInt(req.query.page) || 1;
    const limit = 5;

    const query = {
      isAdmin: false,
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };

    const userData = await User.find(query)
      .sort({ createdOn: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    if (req.query.json === 'true') {
      return res.json({
        data: userData,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    }

    res.render('admin/customers', {
      data: userData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      search: search
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

const customerUnblocked = async (req, res) => {
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