import { chromium, FullConfig, Page } from '@playwright/test'

// Replace 'any' with proper types
export default async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...')
  
  // Create a browser instance for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    console.log(`⏳ Waiting for server at ${baseURL}...`)
    
    let retries = 0
    const maxRetries = 30
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 })
        if (response && response.ok()) {
          console.log('✅ Server is ready!')
          break
        }
      } catch (error: unknown) {
        retries++
        if (retries === maxRetries) {
          throw new Error(`Server not ready after ${maxRetries} attempts`)
        }
        console.log(`⏳ Attempt ${retries}/${maxRetries} - Server not ready, retrying...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Setup test data or authentication state if needed
    console.log('🔧 Setting up test environment...')
    
    // You can add any global setup here, such as:
    // - Creating test usuarios
    // - Setting up test database
    // - Configuring mock services
    
    // Example: Create a test user session
    await setupTestUser(page, baseURL)
    
    console.log('✅ Global setup concluido successfully!')
    
  } catch (error: unknown) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

async function setupTestUser(page: Page, baseURL: string) {
  try {
    // Navigate to the app
    await page.goto(baseURL)
    
    // Check if we need to setup authentication
    // This is where you might create test usuarios or setup auth state
    
    console.log('👤 Test user setup concluido')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('⚠️ Test user setup failed (this might be expected):', errorMessage)
  }
}

