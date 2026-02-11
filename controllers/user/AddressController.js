const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema")






const loadAddress = async (req, res) => {

    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const addressData = await Address.findOne({ userId: userId });

        return res.render('user/address', { user: userData, addresses: addressData })

    } catch (error) {

        return res.redirect("/pageNotFound")
    }
}

const postAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const { name, phone, altPhone, pincode, landMark, city, state, addressType } = req.body;

        // Backend Validation
        if (!name || !phone || !altPhone || !pincode || !landMark || !city || !state || !addressType) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (!/^\d{10}$/.test(phone) || !/^\d{10}$/.test(altPhone)) {
            return res.status(400).json({ success: false, message: "Invalid phone numbers" });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ success: false, message: "Invalid pincode" });
        }

        if (city.trim().length === 0) {
            return res.status(400).json({ success: false, message: "City cannot be empty" });
        }

        const userAddress = await Address.findOne({ userId: userData._id })
        if (!userAddress) {
            const newAddress = new Address({
                userId: userData._id,
                address: [{ name, phone, altPhone, pincode, landMark, city, state, addressType }]
            })
            await newAddress.save()
        } else {
            userAddress.address.push({ name, phone, altPhone, pincode, landMark, city, state, addressType })
            await userAddress.save()
        }
        return res.status(200).json({ success: true, message: "Address added successfully" });
    } catch (error) {
        console.error("Error in postAddress:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id
        const findAddress = await Address.findOne({ "address._id": addressId })
        if (!findAddress) {
            return res.status(404).json({ success: false, message: "Address not found" })
        }
        await Address.updateOne({ "address._id": addressId }, { $pull: { address: { _id: addressId } } })
        return res.redirect('/address');
    } catch (error) {
        console.error("Error in deleteAddress:", error)
        res.status(500).json({ success: false, message: "Failed to delete Address " })
    }
}

const editAddress = async (req, res) => {

    const { addressId, name, landMark, city, state, pincode, phone, addressType, altPhone } = req.body;

    // Backend Validation
    if (!name || !phone || !altPhone || !pincode || !landMark || !city || !state || !addressType) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!/^\d{10}$/.test(phone) || !/^\d{10}$/.test(altPhone)) {
        return res.status(400).json({ success: false, message: "Invalid phone numbers" });
    }

    if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ success: false, message: "Invalid pincode" });
    }

    if (city.trim().length === 0) {
        return res.status(400).json({ success: false, message: "City cannot be empty" });
    }

    try {
        // Find the parent document containing the address array
        const parentDoc = await Address.findOne({ "address._id": addressId });
        if (!parentDoc) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Update the specific address in the array using positional operator $
        await Address.updateOne(
            { "address._id": addressId },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.landMark": landMark,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone,
                    "address.$.addressType": addressType,
                    "address.$.altPhone": altPhone
                }
            }
        );

        return res.status(200).json({ success: true, message: "Address updated successfully" });
    } catch (error) {
        console.error("❌ Error updating address:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


module.exports = {
    loadAddress,
    postAddress,
    deleteAddress,
    editAddress

}