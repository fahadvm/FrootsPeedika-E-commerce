const User = require("../../models/userSchema")



const loadContactPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = userId ? await User.findById(userId) : null;
        return res.render("user/contact", { user: userData });
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
}

module.exports = {
    loadContactPage
}