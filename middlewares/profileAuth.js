const User = require("../models/userSchema")



const resetPasswordMiddleware = (req, res, next) => {
    if (req.session.resetAllowed) {
        return next();  // ✅ Allow access if OTP was verified
    } else {
        return res.redirect("/forgot-password");  // ❌ Redirect unauthorized users
    }
};

const blockLoggedInUsers = (req, res, next) => {
    console.log(req.session.user)
    if (req.session.user) {  // Assuming userId is stored in session after login
        return res.redirect("/");  // Redirect to home or dashboard
    }
    next();  // Allow access for logged-out users
};

const checkBlockedUser = async (req, res, next) => {
    try {
        // If user is logged in, check if they are blocked
        if (req.session.user) {
            const user = await User.findById(req.session.user);

            // If user is found and is blocked, destroy the session and redirect
            if (user && user.isBlocked) {
                delete req.session.user;
                req.flash('error', 'Your account has been blocked');
                return res.redirect('/login');
            }
        }

        // If user is not logged in OR not blocked, proceed normally
        next();
    } catch (error) {
        console.error("Error checking blocked user:", error);
        res.status(500).send('Server Error');
    }
};

// const loggedinblock = async (req,res,next) => {
//     try {

//         if(req.session.user){
//             res.redirect("/")
//         }
//         next()

//     } catch (error) {
//         res.redirect("/pageNotFound")
//     }
// }


module.exports = {
    resetPasswordMiddleware,
    blockLoggedInUsers,
    checkBlockedUser,
    // loggedinblock,


}