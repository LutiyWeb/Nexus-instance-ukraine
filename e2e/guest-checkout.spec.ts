import { expect, test, type Page } from '@playwright/test'

const appURL = process.env.E2E_BASE_URL
const apiURL = process.env.E2E_API_BASE_URL
const productId = Number(process.env.E2E_PRODUCT_ID)
const productPrice = process.env.E2E_PRODUCT_PRICE
const isOrdersURL = (url: URL) => /\/api\/orders\/?$/.test(url.pathname)

test.use({ baseURL: appURL })
test.describe.configure({ retries: 0 })

test.skip(
  !appURL || !apiURL || !productId,
  'Set E2E_BASE_URL, E2E_API_BASE_URL and E2E_PRODUCT_ID for the test store',
)

test.beforeAll(async ({ request }, testInfo) => {
  testInfo.setTimeout(100_000)
  const productsURL = new URL('/api/products/?limit=1', apiURL).href

  await expect
    .poll(
      async () => {
        try {
          const response = await request.get(productsURL, { timeout: 10_000 })
          if (!response.ok()) return false
          const { data } = await response.json()
          return Array.isArray(data)
        } catch {
          return false
        }
      },
      { message: 'The test store API should be ready', timeout: 90_000, intervals: [2_000, 5_000] },
    )
    .toBe(true)
})

function cartButton(page: Page) {
  return page
    .getByRole('banner')
    .getByRole('button')
    .filter({ has: page.locator('.lucide-shopping-cart') })
}

async function expectProductInCart(page: Page) {
  await expect(page.getByRole('heading', { name: 'Кошик 1', exact: true })).toBeVisible()
  await expect(page.locator(`a.cart-item__title[href="/product/${productId}"]`)).toBeVisible()
}

async function openCartWithProduct(page: Page) {
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' })
  const productCard = page.locator(`a[href="/product/${productId}"]`)
  await productCard.getByRole('button', { name: 'У кошик', exact: true }).click()
  await expect(cartButton(page)).toHaveText('1')
  await cartButton(page).click()
  await expectProductInCart(page)
}

async function fillGuestCheckout(page: Page) {
  await page.getByRole('link', { name: 'Оформити замовлення' }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await page.getByRole('button', { name: 'Відділення Нової Пошти' }).click()
  await page.getByPlaceholder('Іван Іванов').fill('Тестовий Покупець')
  await page.getByPlaceholder('+38 (0##) ###-##-##').fill('+38 (099) 123-45-67')
  await page.getByPlaceholder('Почніть вводити назву міста').fill('Київ')
  await page.getByRole('button', { name: /^(?:м\.\s*)?Київ(?:\s|,|$)/ }).click()
  await page.getByPlaceholder('Оберіть відділення').click()
  await page.getByRole('button', { name: /^Відділення №1 —/ }).click()
  await page.getByRole('button', { name: 'Оплата при отриманні' }).click()
}

test('guest places a Nova Poshta pickup order with cash on delivery', async ({ page }) => {
  test.skip(!productPrice, 'Set E2E_PRODUCT_PRICE for the successful order test')
  const ordersURL = new URL('/api/orders', apiURL).href

  // Only allow order creation on the explicitly configured test API.
  await page.route(isOrdersURL, async (route) => {
    const request = route.request()
    if (request.method() === 'POST' && request.url() !== ordersURL) {
      await route.fulfill({ status: 403, body: 'Checkout is pointing to a different API' })
      return
    }
    await route.continue()
  })

  await openCartWithProduct(page)
  await fillGuestCheckout(page)

  const [orderResponse] = await Promise.all([
    page.waitForResponse(
      (response) => response.request().method() === 'POST' && isOrdersURL(new URL(response.url())),
    ),
    page.getByRole('button', { name: 'Підтвердити замовлення' }).click(),
  ])

  expect(orderResponse.url(), 'Checkout must use the configured test API').toBe(ordersURL)
  expect(orderResponse.ok(), `Order API returned ${orderResponse.status()}`).toBe(true)
  expect(orderResponse.request().postDataJSON()).toMatchObject({
    items: [{ productId, quantity: 1 }],
    deliveryAddress: { deliveryMethod: 'np_branch', npWarehouseNumber: '1' },
    paymentMethod: 'cod',
  })

  const { data: order } = await orderResponse.json()
  const expectedTotal = Number(productPrice)
  expect(order.id).toBeGreaterThan(0)
  expect(order.orderNumber).toMatch(/\S/)
  expect(Number(order.totalPrice)).toBe(expectedTotal)

  await expect(page).toHaveURL(new URL(`/order/${order.id}`, appURL).href)
  await expect(page.getByRole('heading', { name: 'Замовлення оформлено!' })).toBeVisible()
  await expect(
    page.getByText(`Номер замовлення: ${order.orderNumber}`, { exact: true }),
  ).toBeVisible()
  const formattedTotal = expectedTotal.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  await expect(page.getByText(`${formattedTotal} UAH`, { exact: true })).toBeVisible()

  await cartButton(page).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByText('Кошик порожній', { exact: true })).toBeVisible()
})

test('guest keeps the cart when checkout rejects an out-of-stock order', async ({ page }) => {
  await page.route(isOrdersURL, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 409, json: { error: { message: 'NOT_ENOUGH_STOCK' } } })
      return
    }
    await route.continue()
  })

  await openCartWithProduct(page)
  await fillGuestCheckout(page)
  await page.getByRole('button', { name: 'Підтвердити замовлення' }).click()

  await expect(page.getByText('Недостатньо товару на складі.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/checkout$/)
  await cartButton(page).click()
  await expectProductInCart(page)
})

test('guest cart keeps its product and quantity after a page reload', async ({ page }) => {
  await openCartWithProduct(page)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expectProductInCart(page)
})
