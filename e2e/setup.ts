import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { chromium, Browser, BrowserContext, Page } from 'playwright'

let browser: Browser
let context: BrowserContext
let page: Page

// Setup global browser instance
beforeAll(async () => {
  browser = await chromium.launch({
    headless: process.env.CI === 'true',
    slowMo: process.env.CI === 'true' ? 0 : 100
  })
})

// Cleanup global browser instance
afterAll(async () => {
  await browser?.close()
})

// Setup fresh context and page for each test
beforeEach(async () => {
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Mock geolocation
    geolocation: { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
    permissions: ['geolocation']
  })
  
  page = await context.newPage()
  
  // Add console logging in development
  if (process.env.NODE_ENV !== 'production') {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text())
      }
    })
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message)
    })
  }
})

// Cleanup context and page after each test
afterEach(async () => {
  await page?.close()
  await context?.close()
})

// Export for use in tests
export { browser, context, page }

// Helper functions for common E2E operations
export const e2eHelpers = {
  /**
   * Navigate to a page and wait for it to load
   */
  async goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) {
    await page.goto(url, { waitUntil: options?.waitUntil || 'networkidle' })
    await page.waitForLoadState('domcontentloaded')
  },

  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout = 5000) {
    return await page.waitForSelector(selector, { state: 'visible', timeout })
  },

  /**
   * Fill a form field
   */
  async fillField(selector: string, value: string) {
    await page.fill(selector, value)
  },

  /**
   * Click an element
   */
  async click(selector: string) {
    await page.click(selector)
  },

  /**
   * Take a screenshot
   */
  async screenshot(nome: string) {
    await page.screenshot({ 
      path: `e2e/screenshots/${nome}.png`,
      fullPage: true 
    })
  },

  /**
   * Wait for navigation
   */
  async waitForNavigation() {
    await page.waitForLoadState('networkidle')
  },

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string> {
    return await page.textContent(selector) || ''
  },

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return await page.locator(selector).count() > 0
  },

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp) {
    return await page.waitForResponse(urlPattern)
  },

  /**
   * Mock API response
   */
  async mockApiResponse(url: string | RegExp, response: unknown) {
    await page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  },

  /**
   * Login helper
   */
  async login(email: string, password: string) {
    await this.goto('/auth/login')
    await this.fillField('[data-testid="email-input"]', email)
    await this.fillField('[data-testid="password-input"]', password)
    await this.click('[data-testid="login-button"]')
    await this.waitForNavigation()
  },

  /**
   * Logout helper
   */
  async logout() {
    await this.click('[data-testid="user-menu"]')
    await this.click('[data-testid="logout-button"]')
    await this.waitForNavigation()
  },

  /**
   * Wait for loading to finish
   */
  async waitForLoading() {
    await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 10000 })
  },

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await page.locator(selector).scrollIntoViewIfNeeded()
  },

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string) {
    await page.selectOption(selector, value)
  },

  /**
   * Upload file
   */
  async uploadFile(selector: string, filePath: string) {
    await page.setInputFiles(selector, filePath)
  },

  /**
   * Wait for toast message
   */
  async waitForToast(message?: string) {
    const toastSelector = '[data-testid="toast"]'
    await this.waitForElement(toastSelector)
    
    if (message) {
      await page.waitForSelector(`${toastSelector}:has-text("${message}")`)
    }
  },

  /**
   * Check accessibility
   */
  async checkAccessibility() {
    // This would require axe-playwright or similar
    // For now, just check basic accessibility features
    const hasMainLandmark = await this.elementExists('main')
    const hasHeadings = await this.elementExists('h1, h2, h3, h4, h5, h6')
    const hasSkipLink = await this.elementExists('[href="#main-content"]')
    
    return {
      hasMainLandmark,
      hasHeadings,
      hasSkipLink
    }
  }
}

export default e2eHelpers




