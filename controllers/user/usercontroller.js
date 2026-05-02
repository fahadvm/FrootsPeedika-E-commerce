const { StatusCodes, Messages } = require('../../helpers/constants');

const User = require("../../models/userSchema")
const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema");
const Wallet = require('../../models/walletSchema')


const nodemailer = require("nodemailer")
const env = require('dotenv').config()
const bcrypt = require('bcrypt')




const signup = async (req, res) => {
    try {
        const { username, phone, email, password, cPassword, referCode } = req.body;
        console.log(username)

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone) || /^0+$/.test(phone)) {
            return res.render("user/signup", { message: Messages.INVALID_PHONE });
        }

        // if (password !== cPassword) {
        //     return res.render("user/signup", { message: "Passwords don not match" });
        // }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("user/signup", { message: Messages.EMAIL_ALREADY_EXISTS });
        }

        // if (referCode) {
        //     const cheeckReferal = await User.findOne({ referCode: referCode })
        //     console.log('cheeckReferal:', cheeckReferal)
        //     if (!cheeckReferal) {
        //         req.session.Emessage = 'Invalid Referal Code, Please try again'
        //         return
        //     }
        //     const wallet = await Wallet.findOne({ userId: cheeckReferal._id })
        //     wallet.balance += 500
        //     wallet.transactions.push({
        //         type: 'credit',
        //         amount: 500,
        //         description: 'Referal Code Credition',
        //         date: new Date(),
        //     })
        //     await wallet.save()
        // }


        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp)

        if (!emailSent) {
            return res.json('email-error')
        }
        req.session.userOtp = otp;
        req.session.userData = { username, phone, email, password };

        res.render("user/verify-otp")
        console.log("otp send", otp)
    }
    catch (error) {
        console.log("signup error", error)
        res.redirect('/pageNotFound')
    }

}

const loadsignup = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("user/signup", { message: "" });
        } else {
            res.redirect('/')

        }
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Demo HR Login Bypass ---
        if (email === 'demo@example.com' && password === 'password123') {
            let demoUser = await User.findOne({ email: 'demo@example.com' });
            if (!demoUser) {
                const passwordHash = await bcrypt.hash('password123', 10);
                demoUser = new User({
                    username: 'Demo HR',
                    email: 'demo@example.com',
                    phone: '9999999999',
                    password: passwordHash,
                    isVerified: true
                });
                await demoUser.save();
            }
            req.session.user = demoUser._id;
            console.log('in login session.user (demo):', req.session.user);
            return res.redirect('/');
        }
        // ----------------------------

        const findUser = await User.findOne({ isAdmin: 0, email: email });



        if (!findUser) {
            return res.render('user/login', { message: Messages.USER_NOT_FOUND });
        }

        if (findUser.isBlocked) {
            return res.render('user/login', { message: Messages.USER_BLOCKED });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render('user/login', { message: Messages.INCORRECT_PASSWORD });
        }

        req.session.user = findUser._id;
        console.log('in login session.user:', req.session.user)
        return res.redirect('/');
    } catch (error) {
        console.log('login error:', error);
        return res.render("user/login", { message: Messages.LOGIN_FAILED });
    }
};

const loadlogin = async (req, res) => {
    try {
        if (!req.session.user) {
            const message = req.flash('error');
            return res.render("user/login", { message: message.length > 0 ? message[0] : "" });
        } else {
            res.redirect('/')
        }
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
}

const loadHomepage = async (req, res) => {
    try {
        const user = req.session.user;
        console.log("this is working")
        console.log("User from session:", req.session.user);
        const categories = await Category.find({ isListed: true })
        const productData = await Product.find({}).limit(3)


        if (user) {
            const userData = await User.findOne({ _id: user })

            return res.render("user/home", { user: userData, products: productData })


        } else {
            return res.render("user/home", { user: null, products: productData, req: req })
        }
    } catch (error) {
        console.log("not found", error)
        res.status(StatusCodes.NOT_FOUND).send(Messages.NOT_FOUND, error)
    }
}

const pageNotFound = async (req, res) => {
    try {
        res.render("user/page-404")
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log('in hashing password', error)
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log(`coming otp:`, otp);

        if (otp === req.session.userOtp) {
            const user = req.session.userData
            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            })
            await saveUserData.save()
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/" })
        }
        else {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.INVALID_OTP })
        }
    } catch (error) {
        console.log("error varifying otp", error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData
        if (!email) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.EMAIL_NOT_FOUND_SESSION })
        }

        const otp = generateOtp()
        req.session.userData = otp

        const emailSent = await sendVerificationEmail(email, otp)
        if (emailSent) {
            console.log('resend otp:', otp)
            res.status(StatusCodes.OK).json({ success: true, message: Messages.OTP_RESEND_SUCCESS })
        }
        else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })
        }


    } catch (error) {
        console.log('error resending otp:', error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: Messages.INTERNAL_SERVER_ERROR })

    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('session destructuring error:', err.message)
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/login')
        })

    } catch (error) {
        console.log('logout error', error)
        return res.redirect('/pageNotFound')
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        })
        return info.accepted.length > 0
    }
    catch (error) {
        console.log(`error sending email`, error)
        return false;
    }
}


const loadShoppingPage = async (req, res) => {
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest';
    try {
        const user = req.session.user;
        const userData = user ? await User.findById(user) : null;

        const { search, category, sort, minPrice, maxPrice, page = 1 } = req.query;
        const perPage = 9;

        // Base filter
        const filter = {
            isBlocked: false,
            stock: { $gt: 0 }
        };

        // Apply filters
        if (search) {
            filter.productName = { $regex: search, $options: 'i' };
        }
        if (category && category !== '') {
            filter.category = category;
        } else {
            // Only include listed categories
            filter.category = { $in: (await Category.find({ isListed: true })).map(c => c._id) };
        }
        if (minPrice && maxPrice) {
            filter.salePrice = { $gte: Number(minPrice), $lte: Number(maxPrice) };
        }

        // Sorting
        const validSortOptions = ['lowToHigh', 'highToLow', 'aToZ', 'zToA', 'newArrivals'];
        const sortOptions = {
            lowToHigh: { salePrice: 1 },
            highToLow: { salePrice: -1 },
            aToZ: { productName: 1 },
            zToA: { productName: -1 },
            newArrivals: { createdAt: -1 }
        };
        const sortCriteria = validSortOptions.includes(sort) ? sortOptions[sort] : { createdAt: -1 };

        // Pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / perPage);
        const currentPage = Math.max(1, Math.min(parseInt(page) || 1, totalPages));

        // Get products
        const products = await Product.find(filter)
            .sort(sortCriteria)
            .skip((currentPage - 1) * perPage)
            .limit(perPage)
            .populate('category')
            .lean(); // Use lean() for better performance in read-only queries

        // Response handling
        if (isAjax) {
            res.json({
                products,
                totalPages,
                currentPage,
                category: category || ''
            });
        } else {
            res.render('user/shop', {
                products,
                categories: await Category.find({ isListed: true }),
                totalPages,
                currentPage,
                search: search || '',
                sort: sort || '',
                category: category || '',
                currentCategory: category || '',
                user: userData
            });
        }
    } catch (error) {
        console.error('Error loading shop page:', error);
        if (isAjax) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: true, message: Messages.INTERNAL_SERVER_ERROR });
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(Messages.INTERNAL_SERVER_ERROR);
        }
    }
};
const loadShoppingPage1 = async (req, res) => {
    try {

        res.render('user/shop1');

    } catch (error) {
        console.error('Error loading shop page:', error);

    }
};
const loadAboutpage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = userId ? await User.findById(userId) : null;
        return res.render("user/about", { user: userData });
    } catch (error) {
        return res.redirect("/pageNotFound")
    }
}



module.exports = {
    loadHomepage,
    pageNotFound,
    loadsignup,
    loadlogin,
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout,
    loadShoppingPage,
    loadShoppingPage1,
    loadAboutpage,
}





