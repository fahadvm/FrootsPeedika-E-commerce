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
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Common Response Messages
 */
const Messages = {
    SUCCESS: 'Success',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden access',
    ORDER_NOT_FOUND: 'Order not found',
    USER_NOT_FOUND: 'User not found',
    PRODUCT_NOT_FOUND: 'Product not found',
    CATEGORY_NOT_FOUND: 'Category not found',
    COUPON_NOT_FOUND: 'Coupon not found',
    UNAUTHORIZED: 'Unauthorized',
    ALREADY_EXISTS: 'Already exists'
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
