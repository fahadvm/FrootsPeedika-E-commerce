const User = require("../../models/userSchema")
const { StatusCodes, Messages } = require('../../helpers/constants');

const loadprofile = async (req, res) => {
    try {
        const adminId = req.session.admin;
        console.log("adminId:", adminId)
        const userData = await User.findById(adminId);
        console.log("userData:", userData)
        res.render("admin/admin-profile", {
            admin: userData,

        })
    } catch (error) {
        console.error('Error:', error)
        res.redirect("/pageNotFound")
    }

}

const loadEditProfile = async (req, res) => {
    try {
        const adminId = req.session.admin;
        const userData = await User.findById(adminId);
        if (!userData) {
            return res.redirect("/pageNotFound");
        }
        res.render("admin/edit-profile", { admin: userData });
    } catch (error) {
        console.error('Error:', error);
        res.redirect("/pageNotFound");
    }
};



const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email } = req.body;
        const profilePicture = req.file ? req.file.path : undefined;

        const updatedData = {
            username,
            email,
            ...(profilePicture && { profilePicture }),
        };

        const updatedAdmin = await Admin.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedAdmin) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: Messages.USER_NOT_FOUND });
        }

        res.status(StatusCodes.OK).json(updatedAdmin);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.INTERNAL_SERVER_ERROR });
    }
};





module.exports = {
    loadprofile,
    loadEditProfile,
    updateProfile

}