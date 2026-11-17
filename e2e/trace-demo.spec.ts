import { test, expect } from '@playwright/test'

// Учебный тест: падает специально, чтобы посмотреть trace в CI. Ветка demo/trace, в dev не сливать.
test('главная: шапка с кнопкой каталога', async ({ page }) => {
  await page.goto('/')

  // Ошибка специально: кнопка называется «Каталог», а не «Каталог товарів»
  await expect(page.getByRole('button', { name: 'Каталог товарів', exact: true })).toBeVisible({
    timeout: 5000,
  })
})
