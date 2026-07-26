/**
 * Checkout validation lives in `delivery.ts`, because what counts as a valid address
 * depends on the chosen delivery method. Re-exported here so existing
 * `~/contracts/checkout` imports keep working.
 */
export {
  CHECKOUT_ERROR_MESSAGES,
  DELIVERY_METHODS,
  DELIVERY_METHOD_LABELS,
  DELIVERY_UNAVAILABLE_MESSAGE,
  checkoutSchema,
  isWarehouseMethod,
  type CheckoutForm,
  type DeliveryMethod,
} from './delivery'
