const { StatusCodes, Messages } = require('../../helpers/constants');

const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema")
const Order = require("../../models/orderSchema")

const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session")
const sharp = require("sharp")
const path = require("path")
const fs = require('fs')


function generateOtp() {
    const digits = "1234567890"
    let otp = "";
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp
}

const sendVerificationEmail = async (email, otp) => {
    try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            }
        })

        const mailOption = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your OTP for password reset",
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP : ${otp}</h4><br></b>`,

        }

        const info = await transporter.sendMail(mailOption);
        console.log("Email sent:", info.messageId)

        return true;

    } catch (error) {

        console.error("error sending email", error);
        return false

    }
}


const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash

    } catch (error) {


    }
}



const getForgotPassPage = async (req, res) => {
    try {

        res.render("user/forgot-password");

    } catch (error) {

        res.redirect("/pageNotFound")

    }
}

const forgotEmailValid = async (req, res) => {
    try {
        const { email } = req.body;
        const findUser = await User.findOne({ email: email });

        if (!findUser) {
            return res.render("user/forgot-password", {
                message: Messages.NO_ACCOUNT_FOR_EMAIL
            });
        }

        // If user is Google-only, they don't have a local password to reset
        if (findUser.googleId && !findUser.password) {
            return res.render("user/forgot-password", {
                message: Messages.GOOGLE_LOGIN_REQUIRED
            });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            req.session.userOtp = otp;
            req.session.email = email;
            res.render("user/forgotPass-otp");
            console.log("OTP Sent Successfully:", otp);
        } else {
            res.render("user/forgot-password", {
                message: Messages.UNABLE_SEND_OTP
            });
        }
    } catch (error) {
        console.error("Forgot email validation error:", error);
        res.redirect("/pageNotFound");
    }
};

const verifyForgotPassOtp = async (req, res) => {
    try {

        const enteredOtp = req.body.otp;
        if (enteredOtp === req.session.userOtp) {
            req.session.resetAllowed = true;
            res.json({ success: true, redirectUrl: "/reset-password" })
        } else {
            res.json({ success: false, message: Messages.OTP_NOT_MATCHING })
        }

    } catch (error) {

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })

    }
}

const getResetPassPage = async (req, res) => {
    try {

        res.render("user/reset-password")

    } catch (error) {

        res.redirect("/pageNotFound")

    }
}

const resendOtp = async (req, res) => {
    try {
        const email = req.session.email;
        if (!email) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.SESSION_EXPIRED_RESET });
        }

        const otp = generateOtp();
        req.session.userOtp = otp;

        console.log("Resending OTP for password reset to:", email);
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            console.log("Resent Reset OTP:", otp);
            res.status(StatusCodes.OK).json({ success: true, message: Messages.NEW_CODE_SENT });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.RESEND_CODE_FAILED });
        }
    } catch (error) {
        console.error("Error resending reset OTP:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
    }
};

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;

        if (!req.session.resetAllowed) {
            return res.render("user/reset-password", { message: Messages.UNAUTHORIZED_RESET });
        }

        if (newPass1 !== newPass2) {
            return res.render("user/reset-password", { message: Messages.PASSWORDS_NOT_MATCH });
        }

        if (newPass1.length < 6) {
            return res.render("user/reset-password", { message: Messages.PASSWORD_MIN_LENGTH });
        }

        const passwordHash = await securePassword(newPass1);
        await User.updateOne(
            { email: email },
            { $set: { password: passwordHash } }
        );

        // Clear only relevant session data
        req.session.userOtp = null;
        req.session.email = null;
        req.session.resetAllowed = null;

        res.redirect("/login");
    } catch (error) {
        console.error("Error updating password:", error);
        res.redirect("/pageNotFound");
    }
};




//--------------------------------------------------------------------------


const userProfile = async (req, res) => {
    try {

        const userId = req.session.user;
        const userData = await User.findById(userId);
        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 })
        const totalOrders = orders.length;
        const totalSpending = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const limitedorders = orders.slice(0, 2)

        const addressData = await Address.findOne({ userId: userId });

        res.render("user/profile", {
            user: userData, addresses: addressData, orders: limitedorders, totalOrders, totalSpending
        })

    } catch (error) {

        console.error('Error:', error)
        res.redirect("/pageNotFound")

    }
}

const loadeditprofile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("user/edit-profile", {
            user: userData,

        })
    } catch (error) {
        console.error('Error:', error)
        res.redirect("/pageNotFound")
    }

}

const changeEmail = async (req, res) => {
    try {
        res.render('user/change-email')
    } catch (error) {
        console.error('Error:', error)
        res.redirect("/pageNotFound")
    }
}

const changeEmailValid = async (req, res) => {
    try {
        console.log("Logged-in User ID:", req.session.user);

        const userId = req.session.user;
        const userData = await User.findById(userId);
        console.log("Logged-in User mail:", userData.email);


        if (!userData) {
            return res.render("user/change-email", {
                message: Messages.USER_NOT_FOUND_LOGIN,
            });
        }

        const { email } = req.body;
        const loggedInUserEmail = userData.email; // Get logged-in user's email

        // Check if the entered email matches the logged-in user's email
        if (email !== loggedInUserEmail) {
            return res.render("user/change-email", {
                message: Messages.EMAIL_MISMATCH,
            });
        }

        // Generate OTP and send verification email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(loggedInUserEmail, otp);

        if (emailSent) {
            req.session.userOtp = otp;
            req.session.email = email; // Store email for verification
            console.log("OTP Sent Successfully:", otp);
            return res.render("user/change-email-otp");
        } else {
            return res.json({ status: "error", message: Messages.EMAIL_SENDING_FAILED });
        }
    } catch (error) {
        console.error("Error in changeEmailValid:", error);
        res.redirect("/pageNotFound");
    }
};



const verifyemailOtp = async (req, res) => {
    try {

        const enteredOtp = req.body.otp;
        console.log('new email otp', req.body.otp)
        if (enteredOtp === req.session.userOtp) {
            req.session.resetAllowed = true;
            res.json({ success: true, redirectUrl: "/reset-email" })
        } else {
            res.json({ success: false, message: Messages.OTP_NOT_MATCHING })
        }

    } catch (error) {

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })

    }
}

const getresetemailpage = async (req, res) => {
    try {

        res.render("user/reset-email");

    } catch (error) {

        res.redirect("/pageNotFound")

    }
}


const postNewEmail = async (req, res) => {
    try {
        const { newEmail1, newEmail2 } = req.body; // Change variable names to reflect emails

        const email = req.session.email; // Get existing email from session

        const emailHave = await User.findOne({ email: newEmail1 })
        if (emailHave) {
            console.log('Email already exixts')
            return res.render("reset-email", { message: Messages.EMAIL_ALREADY_EXISTS_TRY_ANOTHER })
        }

        if (newEmail1 === newEmail2) {
            await User.updateOne(
                { email: email },
                { $set: { email: newEmail1 } } // Update email field
            );


            // Clear session data
            req.session.userOtp = null;
            req.session.email = null;
            req.session.resetAllowed = null;

            res.redirect("/userProfile");
        } else {
            res.render("reset-email", { message: Messages.EMAILS_NOT_MATCH });
        }

    } catch (error) {
        console.error(error); // Log error for debugging
        res.redirect("/pageNotFound");
    }
};


const changePassword = async (req, res) => {
    try {
        res.render('user/changepass-email-valid.ejs')
    } catch (error) {
        console.error('Error:', error)
        res.redirect("/pageNotFound")
    }
}

const changePassEmailValid = async (req, res) => {
    try {
        console.log("Logged-in User ID:", req.session.user);

        const userId = req.session.user;
        const userData = await User.findById(userId);
        console.log("Logged-in User mail in password change:", userData.email);


        if (!userData) {
            return res.render("user/changepass-email-valid", {
                message: Messages.USER_NOT_FOUND_LOGIN,
            });
        }

        const { email } = req.body;
        const loggedInUserEmail = userData.email; // Get logged-in user's email

        // Check if the entered email matches the logged-in user's email
        if (email !== loggedInUserEmail) {
            return res.render("user/changepass-email-valid", {
                message: Messages.EMAIL_MISMATCH,
            });
        }

        // Generate OTP and send verification email
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(loggedInUserEmail, otp);

        if (emailSent) {
            req.session.userOtp = otp;
            req.session.email = email; // Store email for verification
            console.log("OTP Sent Successfully:", otp);
            return res.render("user/change-password-otp");
        } else {
            return res.json({ status: "error", message: Messages.EMAIL_SENDING_FAILED });
        }
    } catch (error) {
        console.error("Error in changeEmailValid:", error);
        res.redirect("/pageNotFound");
    }
};

const verifypassemailOtp = async (req, res) => {
    try {

        const enteredOtp = req.body.otp;
        console.log('new pass otp', req.body.otp)
        if (enteredOtp === req.session.userOtp) {
            req.session.resetAllowed = true;
            res.json({ success: true, redirectUrl: "/new-password" })
        } else {
            res.json({ success: false, message: Messages.OTP_NOT_MATCHING })
        }

    } catch (error) {

        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })

    }
}

const getnewpasspage = async (req, res) => {
    try {

        res.render("user/new-password");

    } catch (error) {

        res.redirect("/pageNotFound")

    }
}

const NewPassword = async (req, res) => {
    try {

        const { newPass1, newPass2 } = req.body;
        const email = req.session.email;

        if (newPass1 === newPass2) {
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                { email: email },
                { $set: { password: passwordHash } }
            );
            req.session.userOtp = null;
            req.session.email = null;
            req.session.resetAllowed = null;

            res.redirect("/editProfile")
        } else {
            res.render("/new-password", { message: Messages.PASSWORDS_NOT_MATCH })
        }

    } catch (error) {

        res.redirect("/pageNotFound")

    }
}


const editprofile = async (req, res) => {
    const { username, phone, email, firstName, lastName, gender } = req.body;
    console.log('req.body:', req.body)

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone) || /^0+$/.test(phone)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid phone number. Must be a valid 10-digit number starting with 6-9." });
    }

    const userId = req.session.user; // Assuming user ID is stored in session

    try {
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: Messages.USER_NOT_FOUND });
        }

        // Handle image upload
        if (req.files && req.files.image && req.files.image[0]) {
            const file = req.files.image[0];

            console.log("Uploaded file details:", file);

            if (!file.path) {
                return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "File upload failed." });
            }

            const filename = `${Date.now()}-${file.originalname.replace(/\s/g, "")}`;
            const destFolder = path.join(__dirname, "../../public/uploads/user-images");

            // Ensure the folder exists
            await fs.promises.mkdir(destFolder, { recursive: true });

            const filepath = path.join(destFolder, filename);

            // Move the file
            try {
                await fs.promises.rename(file.path, filepath);
                console.log(`File moved to: ${filepath}`);
            } catch (renameError) {
                console.error("Error moving file:", renameError);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error processing image upload." });
            }

            // Save the new image path
            user.image = `uploads/user-images/${filename}`;
        }

        // Update user details
        user.username = username;
        user.phone = phone;
        user.email = email;
        user.firstName = firstName;
        user.secondName = lastName;
        user.gender = gender;



        // Save user
        await user.save();

        res.status(StatusCodes.OK).json({ success: true, message: Messages.PROFILE_UPDATED });
    } catch (error) {
        console.error("Error in editProfile:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
    }
};


const addProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const imagePath = `/uploads/${req.file.filename}`; // Save the relative path

        // Update user in database
        await User.findByIdAndUpdate(userId, { image: imagePath });

        res.json({ success: true, imagePath });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR });
    }
}

module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    changeEmail,
    loadeditprofile,
    changeEmailValid,
    verifyemailOtp,
    getresetemailpage,
    postNewEmail,
    changePassword,
    changePassEmailValid,
    verifypassemailOtp,
    getnewpasspage,
    NewPassword,
    editprofile,
    addProfile,

}