// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest'
import { buildOrderPayload, checkoutSchema } from '~/contracts/checkout'
import type { Product } from '~/types/product'

const mockProduct: Product = {
  id: 101,
  title: 'Навушники Marshall Major V',
  slug: 'marshall-major-v',
  description: 'Бездротові навушники',
  sku: 'MM-5',
  category: 'Навушники',
  categoryId: 2,
  categorySlug: 'naushnyky',
  brand: 'Marshall',
  brandId: 5,
  price: 6499,
  compareAtPrice: null,
  discountPercentage: null,
  rating: 4.9,
  stock: 10,
  inStock: true,
  status: 'active',
  thumbnail: null,
  images: [],
  createdAt: null,
  updatedAt: null,
}

describe('buildOrderPayload', () => {
  it('builds a guest order payload with cart items, customer info, and Nova Poshta branch address', () => {
    const payload = buildOrderPayload({
      isLoggedIn: false,
      cartItems: [{ product: mockProduct, qty: 2 }],
      form: {
        recipientName: 'Іван Франко',
        phone: '+38 (099) 123-45-67',
        street: '',
        house: '',
        apartment: '',
        notes: 'Подзвоніть за годину',
      },
      deliveryMethod: 'np_branch',
      selectedAddressId: null,
      selectedCity: {
        present: 'м. Київ, Київська обл.',
        deliveryCityRef: 'city-ref-kyiv',
      },
      selectedWarehouse: {
        ref: 'wh-ref-1',
        number: '1',
        shortAddress: 'Київ, вул. Пирогівський шлях, 135',
      },
      paymentMethod: 'cod',
      noCallback: true,
    })

    expect(payload).toEqual({
      items: [{ productId: 101, quantity: 2 }],
      customer: {
        firstName: 'Іван Франко',
        phone: '+38 (099) 123-45-67',
      },
      deliveryAddress: {
        recipientName: 'Іван Франко',
        phone: '+38 (099) 123-45-67',
        deliveryMethod: 'np_branch',
        city: 'м. Київ, Київська обл.',
        npCityRef: 'city-ref-kyiv',
        npWarehouseRef: 'wh-ref-1',
        npWarehouseNumber: '1',
        npWarehouseAddress: 'Київ, вул. Пирогівський шлях, 135',
      },
      paymentMethod: 'cod',
      noCallback: true,
      notes: 'Подзвоніть за годину',
    })
  })

  it('builds a logged-in user order payload without guest items/customer when using a saved address', () => {
    const payload = buildOrderPayload({
      isLoggedIn: true,
      cartItems: [{ product: mockProduct, qty: 1 }],
      form: {
        recipientName: 'Олена Коваль',
        phone: '+38 (067) 765-43-21',
        street: '',
        house: '',
        apartment: '',
        notes: '',
      },
      deliveryMethod: 'np_courier',
      selectedAddressId: 42,
      selectedCity: null,
      selectedWarehouse: null,
      paymentMethod: 'card',
      noCallback: false,
    })

    expect(payload).toEqual({
      addressId: 42,
      paymentMethod: 'card',
      noCallback: false,
      notes: undefined,
    })
    expect(payload).not.toHaveProperty('items')
    expect(payload).not.toHaveProperty('customer')
    expect(payload).not.toHaveProperty('deliveryAddress')
  })

  it('builds a logged-in user courier order payload with street, house, and apartment when no saved address is selected', () => {
    const payload = buildOrderPayload({
      isLoggedIn: true,
      cartItems: [{ product: mockProduct, qty: 1 }],
      form: {
        recipientName: 'Олена Коваль',
        phone: '+38 (067) 765-43-21',
        street: 'Хрещатик',
        house: '22',
        apartment: '15',
        notes: '',
      },
      deliveryMethod: 'np_courier',
      selectedAddressId: null,
      selectedCity: {
        present: 'м. Київ, Київська обл.',
        deliveryCityRef: 'city-ref-kyiv',
      },
      selectedWarehouse: null,
      paymentMethod: 'cod',
      noCallback: false,
    })

    expect(payload).toEqual({
      deliveryAddress: {
        recipientName: 'Олена Коваль',
        phone: '+38 (067) 765-43-21',
        deliveryMethod: 'np_courier',
        city: 'м. Київ, Київська обл.',
        npCityRef: 'city-ref-kyiv',
        street: 'Хрещатик',
        house: '22',
        apartment: '15',
      },
      paymentMethod: 'cod',
      noCallback: false,
      notes: undefined,
    })
    expect(payload).not.toHaveProperty('items')
    expect(payload).not.toHaveProperty('customer')
  })
})

describe('checkoutSchema', () => {
  it('validates recipientName and phone and rejects invalid inputs', () => {
    expect(
      checkoutSchema.safeParse({
        recipientName: 'Іван Франко',
        phone: '+38 (099) 123-45-67',
      }).success,
    ).toBe(true)

    const invalid = checkoutSchema.safeParse({
      recipientName: 'І',
      phone: '+38 (0',
    })
    expect(invalid.success).toBe(false)
  })
})
