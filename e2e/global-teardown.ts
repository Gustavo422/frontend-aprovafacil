import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  try {
    // Clear any temporary files
    // TODO: Implement temporary files cleanup logic
    
    console.log('✅ Global teardown concluido successfully!')
    
  } catch (error) {
    // Don't throw here as it might mask test failures
  }
}

export default globalTeardown




