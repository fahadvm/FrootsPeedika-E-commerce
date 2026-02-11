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
        const { name, phone, altPhone, pincode, landMark, city, state, addressType, isPrimary } = req.body;

        // Backend Validation
        if (!name || !phone || !altPhone || !pincode || !landMark || !city || !state || !addressType) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone) || /^0+$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Invalid phone numbers. Must be a valid 10-digit number starting with 6-9." });
        }
        if (!phoneRegex.test(altPhone) || /^0+$/.test(altPhone)) {
            return res.status(400).json({ success: false, message: "Invalid alternate phone numbers. Must be a valid 10-digit number starting with 6-9." });
        }

        const pincodeRegex = /^[1-9]\d{5}$/;
        if (!pincodeRegex.test(pincode) || /^0+$/.test(pincode)) {
            return res.status(400).json({ success: false, message: "Invalid pincode. Must be a valid 6-digit number not starting with 0." });
        }

        const userAddress = await Address.findOne({ userId: userData._id });
        const isFirstAddress = !userAddress || userAddress.address.length === 0;
        const setAsPrimary = isPrimary === 'true' || isPrimary === true || isFirstAddress;

        if (setAsPrimary) {
            // Unset current primary addresses
            await Address.updateOne(
                { userId: userData._id, "address.isPrimary": true },
                { $set: { "address.$.isPrimary": false, "address.$.isDefault": false } }
            );
        }

        const newAddressEntry = {
            name, phone, altPhone, pincode, landMark, city, state, addressType,
            isPrimary: setAsPrimary,
            isDefault: setAsPrimary
        };

        if (!userAddress) {
            const newAddress = new Address({
                userId: userData._id,
                address: [newAddressEntry]
            });
            await newAddress.save();
        } else {
            userAddress.address.push(newAddressEntry);
            await userAddress.save();
        }
        return res.status(200).json({ success: true, message: "Address added successfully" });
    } catch (error) {
        console.error("Error in postAddress:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const userId = req.session.user;

        const addressDoc = await Address.findOne({ userId: userId });
        if (!addressDoc) {
            return res.status(404).json({ success: false, message: "Address record not found" });
        }

        const addressToDelete = addressDoc.address.id(addressId);
        if (!addressToDelete) {
            return res.status(404).json({ success: false, message: "Specific address not found" });
        }

        const wasPrimary = addressToDelete.isPrimary || addressToDelete.isDefault;

        // Remove the address
        await Address.updateOne(
            { userId: userId },
            { $pull: { address: { _id: addressId } } }
        );

        // If we deleted the primary address, assign a new one
        if (wasPrimary) {
            const updatedDoc = await Address.findOne({ userId: userId });
            if (updatedDoc && updatedDoc.address.length > 0) {
                const firstRemainingId = updatedDoc.address[0]._id;
                await Address.updateOne(
                    { userId: userId, "address._id": firstRemainingId },
                    { $set: { "address.$.isPrimary": true, "address.$.isDefault": true } }
                );
            }
        }

        return res.redirect('/address');
    } catch (error) {
        console.error("Error in deleteAddress:", error);
        res.status(500).json({ success: false, message: "Failed to delete Address" });
    }
};

const editAddress = async (req, res) => {
    const { addressId, name, landMark, city, state, pincode, phone, addressType, altPhone, isPrimary } = req.body;
    const userId = req.session.user;

    // Backend Validation
    if (!name || !phone || !altPhone || !pincode || !landMark || !city || !state || !addressType) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone) || /^0+$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Invalid phone numbers. Must be a valid 10-digit number starting with 6-9." });
    }
    if (!phoneRegex.test(altPhone) || /^0+$/.test(altPhone)) {
        return res.status(400).json({ success: false, message: "Invalid alternate phone numbers. Must be a valid 10-digit number starting with 6-9." });
    }

    const pincodeRegex = /^[1-9]\d{5}$/;
    if (!pincodeRegex.test(pincode) || /^0+$/.test(pincode)) {
        return res.status(400).json({ success: false, message: "Invalid pincode. Must be a valid 6-digit number not starting with 0." });
    }

    try {
        const setAsPrimary = isPrimary === 'true' || isPrimary === true;

        if (setAsPrimary) {
            // Unset current primary addresses
            await Address.updateOne(
                { userId: userId, "address.isPrimary": true },
                { $set: { "address.$.isPrimary": false, "address.$.isDefault": false } }
            );
        }

        const updateResult = await Address.updateOne(
            { userId: userId, "address._id": addressId },
            {
                $set: {
                    "address.$.name": name,
                    "address.$.landMark": landMark,
                    "address.$.city": city,
                    "address.$.state": state,
                    "address.$.pincode": pincode,
                    "address.$.phone": phone,
                    "address.$.addressType": addressType,
                    "address.$.altPhone": altPhone,
                    "address.$.isPrimary": setAsPrimary,
                    "address.$.isDefault": setAsPrimary
                }
            }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        return res.status(200).json({ success: true, message: "Address updated successfully" });
    } catch (error) {
        console.error("❌ Error updating address:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const setPrimaryAddress = async (req, res) => {
    try {
        const { addressId } = req.body;
        const userId = req.session.user;

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Address ID is required" });
        }

        // Unset all previous primary addresses for this user
        await Address.updateOne(
            { userId: userId, "address.isPrimary": true },
            { $set: { "address.$.isPrimary": false, "address.$.isDefault": false } }
        );

        // Set the selected address as primary
        const result = await Address.updateOne(
            { userId: userId, "address._id": addressId },
            { $set: { "address.$.isPrimary": true, "address.$.isDefault": true } }
        );

        if (result.modifiedCount > 0) {
            return res.status(200).json({ success: true, message: "Defined as primary address" });
        } else {
            return res.status(404).json({ success: false, message: "Address not found" });
        }
    } catch (error) {
        console.error("Error setting primary address:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


module.exports = {
    loadAddress,
    postAddress,
    deleteAddress,
    editAddress,
    setPrimaryAddress
};