const { userBlockedEmitter } = require("../controllers/admin/customerController")

const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((user) => {
        if (user && !user.isBlocked) {
          next()
        } else {
          delete req.session.user
          req.flash('error', 'Your account has been blocked')
          res.redirect("/login")
        }
      })
      .catch((error) => {
        console.log("User Auth Error", error)
        res.status(500).send("Internal Server Error")
      })
  } else {
    res.redirect("/login")
  }
}

module.exports = { userAuth }

userBlockedEmitter.on("userBlocked", (userId) => {
  // This function will be called whenever a user is blocked
  // You might want to implement a way to find and clear the session for this user
  // This could involve storing session IDs in the database or using a different session store
  console.log(`User ${userId} has been blocked. Their session should be cleared.`)
})



const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    User.findById(req.session.admin)
      .then(admin => {
        if (admin && admin.isAdmin) {
          next();
        } else {
          req.session.destroy();  // Clear invalid session
          res.redirect('/admin/login');
        }
      })
      .catch(error => {
        console.error("Admin Auth Error", error);
        res.redirect('/admin/login');
      });
  } else {
    res.redirect('/admin/login');
  }
};



module.exports = {
  userAuth,
  adminAuth,
}