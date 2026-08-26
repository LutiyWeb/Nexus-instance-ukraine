export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: number
  productId: number
  selectedVariantId: number | null
  productTitle: string
  sku: string
  variant: { id: number; title: string; sku: string; attributes: unknown } | null
  quantity: number
  unitPrice: string
  totalPrice: string
  createdAt: string
}

export interface OrderCustomerSnapshot {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

export interface OrderAddressSnapshot {
  addressId?: number
  recipientName: string
  phone: string
  deliveryMethod?: 'courier' | 'np_courier' | 'np_branch' | 'np_postomat'
  city: string
  // courier / np_courier
  street?: string
  house?: string
  apartment?: string
  // np_branch / np_postomat
  npCityRef?: string
  npWarehouseRef?: string
  npWarehouseNumber?: string
  npWarehouseAddress?: string
}

export interface Order {
  id: number
  userId: number
  orderNumber: string
  status: OrderStatus
  subtotalPrice: string
  discountAmount: string
  deliveryPrice: string
  totalPrice: string
  currency: string
  customerSnapshot: OrderCustomerSnapshot | null
  deliveryAddressSnapshot: OrderAddressSnapshot | null
  notes: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}
