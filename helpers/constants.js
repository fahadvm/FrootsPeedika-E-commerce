/**
 * Constants for Order Statuses
 */
const OrderStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURN_REQUEST: 'return request',
    RETURN_REQUEST_REJECTED: 'return request rejected',
    RETURNED: 'returned',
    FAILED: 'failed'
};

/**
 * Constants for Transaction Statuses
 */
const TransactionStatus = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

/**
 * Constants for Transaction Types
 */
const TransactionType = {
    CREDIT: 'credit',
    DEBIT: 'debit'
};

/**
 * Constants for Payment Methods
 */
const PaymentMethod = {
    WALLET: 'wallet',
    UPI: 'upi',
    COD: 'cod',
    NETBANKING: 'netbanking',
    ADMIN: 'admin'
};

/**
 * Constants for Payment Gateways
 */
const PaymentGateway = {
    RAZORPAY: 'razorpay',
    WALLET: 'wallet',
    NONE: 'none',
    COD: 'cod',
    ADMIN: 'admin'
};

/**
 * Constants for Checkout Session Status
 */
const CheckoutStatus = {
    IDLE: 'IDLE',
    IN_PROGRESS: 'IN_PROGRESS'
};

/**
 * Constants for Address Types
 */
const AddressType = {
    HOME: 'home',
    WORK: 'work'
};

/**
 * Constants for Transaction Purpose
 */
const TransactionPurpose = {
    PURCHASE: 'purchase',
    REFUND: 'refund',
    WALLET_ADD: 'wallet_add',
    WALLET_WITHDRAW: 'wallet_withdraw',
    CANCELLATION: 'cancellation',
    RETURN: 'return'
};

/**
 * HTTP Status Codes
 */
const StatusCodes = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * Common Response Messages
 */
const Messages = {
    // Basic messages
    SUCCESS: 'Success',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    CONFLICT: 'Conflict occurred',
    INVALID_INPUT: 'Invalid input data',
    ALREADY_EXISTS: 'Already exists',

    // Auth & User messages
    USER_NOT_FOUND: 'User not found',
    USER_BLOCKED: 'User blocked by admin',
    INCORRECT_PASSWORD: 'Incorrect password',
    LOGIN_FAILED: 'Login failed. Please try again later',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    EMAIL_ALREADY_EXISTS: 'User with this email already exists',
    PHONE_ALREADY_EXISTS: 'User with this phone number already exists',
    INVALID_OTP: 'Invalid OTP, please try again',
    OTP_SENT: 'OTP sent successfully',
    OTP_RESEND_SUCCESS: 'OTP resend successfully',
    EMAIL_NOT_FOUND_SESSION: 'Email is not found in session',
    SESSION_EXPIRED: 'Session expired, please login again',
    SIGNUP_SUCCESS: 'Signup successful',
    VALIDATION_ERROR: 'Validation error',

    // Order & Checkout messages
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CANCELLED: 'Order cancelled successfully',
    ORDER_ALREADY_CANCELLED: 'Order is already cancelled',
    ORDER_RETURNED: 'Order returned successfully',
    ORDER_CANNOT_RETURN: 'Order cannot be returned',
    ORDER_PLACE_SUCCESS: 'Order placed successfully',
    ORDER_PLACE_FAILED: 'Failed to place order',
    CART_EMPTY: 'Cart is empty',
    ADDRESS_NOT_FOUND: 'Address not found',
    INVALID_ADDRESS: 'Invalid address',
    INSUFFICIENT_STOCK: 'Insufficient stock',
    PRODUCT_UNAVAILABLE: 'Product is currently unavailable',
    CATEGORY_UNAVAILABLE: 'Category is currently unavailable',
    INSUFFICIENT_WALLET_BALANCE: 'Insufficient wallet balance',
    PAYMENT_FAILED: 'Payment failed',
    PAYMENT_VERIFIED: 'Payment verified successfully',
    INVALID_SIGNATURE: 'Invalid signature',

    // Product & Category messages
    PRODUCT_NOT_FOUND: 'Product not found',
    CATEGORY_NOT_FOUND: 'Category not found',
    PRODUCT_ALREADY_EXISTS: 'Product with this name already exists',
    CATEGORY_ALREADY_EXISTS: 'Category with this name already exists',
    PRODUCT_LISTED: 'Product listed successfully',
    PRODUCT_UNLISTED: 'Product unlisted successfully',

    // Coupon messages
    COUPON_NOT_FOUND: 'Coupon not found',
    COUPON_EXPIRED: 'Coupon has expired',
    COUPON_ALREADY_USED: 'Coupon already used',
    COUPON_APPLIED: 'Coupon applied successfully',
    COUPON_REMOVED: 'Coupon removed successfully',
    INVALID_COUPON: 'Invalid or expired coupon',

    // Wishlist & Cart messages
    ITEM_ADDED_CART: 'Item added to cart successfully',
    ITEM_REMOVED_CART: 'Item removed from cart successfully',
    ITEM_ADDED_WISHLIST: 'Item added to wishlist successfully',
    ITEM_REMOVED_WISHLIST: 'Item removed from wishlist successfully',

    // Address messages
    ADDRESS_ADDED: 'Address added successfully',
    ADDRESS_UPDATED: 'Address updated successfully',
    ADDRESS_DELETED: 'Address deleted successfully',
    ADDRESS_PRIMARY: 'Defined as primary address',
    ADDRESS_ID_REQUIRED: 'Address ID is required',
    FAILED_DELETE_ADDRESS: 'Failed to delete address',
    ALL_FIELDS_REQUIRED: 'All fields are required',
    INVALID_PHONE: 'Invalid phone number',
    INVALID_PINCODE: 'Invalid pincode',

    // Cart messages
    ITEM_ADDED_CART_SUCCESS: 'Product added to cart',
    ITEM_REMOVED_CART_SUCCESS: 'Product removed from cart',
    INVALID_QUANTITY: 'Invalid quantity',
    MAX_QUANTITY_EXCEEDED: 'Maximum quantity is 5 per product',

    // Payment messages
    PAYMENT_SUCCESS: 'Payment successful',
    PAYMENT_VERIFIED_SUCCESS: 'Payment verified successfully',
    INVALID_PAYMENT_SIGNATURE: 'Invalid payment signature',
    WALLET_RECHARGE_SUCCESS: 'Money added successfully',
    WALLET_TOPUP_DESC: 'Wallet top-up',

    // Admin messages
    ADMIN_NOT_FOUND: 'Who are you??',
    ADMIN_BLOCKED: 'Admin is blocked by admin',
    USER_BLOCKED_SUCCESS: 'User blocked successfully',
    USER_UNBLOCKED_SUCCESS: 'User unblocked successfully',

    // Category CRUD messages
    CATEGORY_ADDED: 'Category added successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',
    CATEGORY_LISTED: 'Category listed successfully',
    CATEGORY_UNLISTED: 'Category unlisted successfully',
    CATEGORY_NAME_EMPTY: 'Category name cannot be empty',
    DESCRIPTION_REQUIRED: 'Description is required',
    OFFER_ADDED: 'Offer added successfully',
    OFFER_REMOVED: 'Offer removed successfully',
    OFFER_UPDATED: 'Offer updated successfully',
    INVALID_PERCENTAGE: 'Invalid percentage value',

    // Product CRUD messages
    PRODUCT_ADDED: 'Product added successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',
    PRODUCT_ALREADY_EXISTS_ALT: 'Product already exists, try another name',
    PRODUCT_NAME_EXISTS: 'Product with this name already exists. Please try another name.',
    PRODUCT_ID_REQUIRED: 'Product ID is required',
    NO_IMAGE_PROVIDED: 'No image file provided',
    IMAGE_SAVED: 'Image saved successfully',
    IMAGE_DELETED: 'Image deleted successfully',
    ALL_IMAGES_REQUIRED: 'Please upload all 4 product images',
    ERROR_SAVING_IMAGE: 'Error saving image',
    ERROR_SAVING_PRODUCT: 'Error saving product',

    // OTP messages
    OTP_NOT_MATCHING: 'OTP not matching',
    SESSION_EXPIRED_RESET: 'Session expired. Please restart the process',
    NEW_CODE_SENT: 'A new code has been sent to your email',
    RESEND_CODE_FAILED: 'Failed to resend code. Please try again',

    // Profile messages
    PROFILE_UPDATED: 'Profile updated successfully',
    EMAIL_SENDING_FAILED: 'Email sending failed.',
    NO_ACCOUNT_FOR_EMAIL: 'No account found with this email address',
    GOOGLE_LOGIN_REQUIRED: 'This account is linked with Google. Please use \'Login with Google\'',
    UNABLE_SEND_OTP: 'Unable to send verification code. Please check your connection',
    EMAIL_MISMATCH: 'Entered email does not match your registered email.',
    USER_NOT_FOUND_LOGIN: 'User not found. Please log in again.',
    EMAIL_ALREADY_EXISTS_TRY_ANOTHER: 'This email already exists, try another one',
    UNAUTHORIZED_RESET: 'Unauthorized access. Please verify your OTP again',
    PASSWORDS_NOT_MATCH: 'Passwords do not match',
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
    EMAILS_NOT_MATCH: 'Emails do not match',

    // Coupon/Order messages
    CART_NOT_FOUND: 'Cart not found',
    SOMETHING_WENT_WRONG: 'Something went wrong',
    COUPON_UPDATED: 'Coupon updated successfully',
    COUPON_DELETED: 'Coupon deleted successfully',
    INVALID_COUPON_ID: 'Invalid coupon ID',
    ERROR_UPDATING_COUPON: 'Error updating coupon',
    INVALID_COUPON_EXPIRED: 'Invalid or expired coupon.',
    REJECT_REASON_REQUIRED: 'Rejection reason is mandatory',
    ORDER_STATUS_UPDATED: 'Order status updated successfully',
    PLAN_ID_REQUIRED: 'Plan ID is required',
    PAYMENT_IN_PROGRESS: 'A payment is already in progress in another tab. Please complete it or wait a few minutes.',
    CHECKOUT_SESSION_EXPIRED: 'Checkout session expired. Please refresh the page.',
    INVOICE_DELIVERED_ONLY: 'Invoice is only available for delivered orders',
    ERROR_GENERATING_INVOICE: 'Error generating invoice',
    INVALID_AMOUNT: 'Invalid or missing amount',
    ORDER_CANNOT_CANCEL: 'Order cannot be cancelled',
    TRANSACTION_CREATED: 'Transaction created successfully',
};

module.exports = {
    OrderStatus,
    TransactionStatus,
    TransactionType,
    PaymentMethod,
    PaymentGateway,
    CheckoutStatus,
    AddressType,
    TransactionPurpose,
    StatusCodes,
    Messages
};
