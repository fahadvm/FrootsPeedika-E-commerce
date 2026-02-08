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

        // if (password !== cPassword) {
        //     return res.render("user/signup", { message: "Passwords don not match" });
        // }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("user/signup", { message: "User with this email already exists" });
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

        const findUser = await User.findOne({ isAdmin: 0, email: email });



        if (!findUser) {
            return res.render('user/login', { message: 'User not found' });
        }

        if (findUser.isBlocked == true) {
            return res.render('user/login', { message: 'User is blocked by admin' });
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            return res.render('user/login', { message: 'Incorrect password' });
        }  
        
        req.session.user = findUser._id;
        console.log('in login session.user:', req.session.user)
        return res.redirect('/');
    } catch (error) {
        console.log('login error:', error);
        return res.render("user/login", { message: "Login failed. Please try again later" });
    }
};

const loadlogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("user/login", { message: "" });
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
        console.log("not found",error)
        res.status(404).send("not found",error)
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
            return res.status(400).json({ success: false, message: "Invalid Otp,please try again" })
        }
    } catch (error) {
        console.log("error varifying otp", error)
        res.status(500).json({ success: false, message: "an error occured" })
    }
}

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is not found in session" })
        }

        const otp = generateOtp()
        req.session.userData = otp

        const emailSent = await sendVerificationEmail(email, otp)
        if (emailSent) {
            console.log('resend otp:', otp)
            res.status(200).json({ success: true, message: 'OTP resend successfully' })
        }
        else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. please try again" })
        }


    } catch (error) {
        console.log('error resending otp:', error)
        res.status(500).json({ success: false, message: "internal error server. please try again" })

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
    try {
        const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest';
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
            res.status(500).json({ error: true, message: 'Failed to load products' });
        } else {
            res.status(500).send('Error loading shop page');
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
        const userData = await User.findById(userId)
        if (!req.session.user) {
            return res.render("user/about",{user:userData});
        } else {
            res.redirect('/')

        }
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





