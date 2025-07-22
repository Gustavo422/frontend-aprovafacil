import { describe, it, expect, beforeEach } from 'vitest'
import { page, e2eHelpers } from './setup'

describe('Authentication E2E Tests', () => {
  const testUser = {
    email: 'test@aprovafacil.com',
    password: 'testpassword123',
    nome: 'Test User'
  }

  beforeEach(async () => {
    // Mock Supabase auth responses
    await e2eHelpers.mockApiResponse(/supabase\.co.*auth/, {
      access_token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: testUser.email,
        user_metadata: { nome: testUser.nome }
      }
    })
  })

  describe('Login Flow', () => {
    it('should display login form', async () => {
      await e2eHelpers.goto('/auth/login')
      
      expect(await e2eHelpers.elementExists('[data-testid="email-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="password-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="login-button"]')).toBe(true)
    })

    it('should show validation errors for empty fields', async () => {
      await e2eHelpers.goto('/auth/login')
      await e2eHelpers.click('[data-testid="login-button"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="email-error"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="password-error"]')).toBe(true)
    })

    it('should show validation error for invalid email', async () => {
      await e2eHelpers.goto('/auth/login')
      await e2eHelpers.fillField('[data-testid="email-input"]', 'invalid-email')
      await e2eHelpers.click('[data-testid="login-button"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="email-error"]')).toBe(true)
    })

    it('should successfully login with valid credentials', async () => {
      await e2eHelpers.goto('/auth/login')
      await e2eHelpers.fillField('[data-testid="email-input"]', testUser.email)
      await e2eHelpers.fillField('[data-testid="password-input"]', testUser.password)
      await e2eHelpers.click('[data-testid="login-button"]')
      
      // Should redirect to dashboard
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard')
    })

    it('should show loading state during login', async () => {
      await e2eHelpers.goto('/auth/login')
      await e2eHelpers.fillField('[data-testid="email-input"]', testUser.email)
      await e2eHelpers.fillField('[data-testid="password-input"]', testUser.password)
      
      // Click login and immediately check for loading state
      await e2eHelpers.click('[data-testid="login-button"]')
      expect(await e2eHelpers.elementExists('[data-testid="login-loading"]')).toBe(true)
    })
  })

  describe('Registration Flow', () => {
    it('should display registration form', async () => {
      await e2eHelpers.goto('/auth/register')
      
      expect(await e2eHelpers.elementExists('[data-testid="nome-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="email-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="password-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="confirm-password-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="register-button"]')).toBe(true)
    })

    it('should validate password confirmation', async () => {
      await e2eHelpers.goto('/auth/register')
      await e2eHelpers.fillField('[data-testid="password-input"]', 'password123')
      await e2eHelpers.fillField('[data-testid="confirm-password-input"]', 'different123')
      await e2eHelpers.click('[data-testid="register-button"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="confirm-password-error"]')).toBe(true)
    })

    it('should successfully register with valid data', async () => {
      await e2eHelpers.goto('/auth/register')
      await e2eHelpers.fillField('[data-testid="nome-input"]', testUser.nome)
      await e2eHelpers.fillField('[data-testid="email-input"]', testUser.email)
      await e2eHelpers.fillField('[data-testid="password-input"]', testUser.password)
      await e2eHelpers.fillField('[data-testid="confirm-password-input"]', testUser.password)
      await e2eHelpers.click('[data-testid="register-button"]')
      
      // Should show success message or redirect
      await e2eHelpers.waitForToast('Conta criada com sucesso')
    })
  })

  describe('Password Reset Flow', () => {
    it('should display forgot password form', async () => {
      await e2eHelpers.goto('/auth/forgot-password')
      
      expect(await e2eHelpers.elementExists('[data-testid="email-input"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="reset-button"]')).toBe(true)
    })

    it('should send reset email with valid email', async () => {
      await e2eHelpers.goto('/auth/forgot-password')
      await e2eHelpers.fillField('[data-testid="email-input"]', testUser.email)
      await e2eHelpers.click('[data-testid="reset-button"]')
      
      await e2eHelpers.waitForToast('Email de recuperação enviado')
    })
  })

  describe('Logout Flow', () => {
    it('should logout successfully', async () => {
      // First login
      await e2eHelpers.login(testUser.email, testUser.password)
      
      // Then logout
      await e2eHelpers.logout()
      
      // Should redirect to login page
      expect(page.url()).toContain('/auth/login')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Should redirect to login
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/auth/login')
    })

    it('should allow access to protected route when authenticated', async () => {
      await e2eHelpers.login(testUser.email, testUser.password)
      await e2eHelpers.goto('/dashboard')
      
      // Should stay on dashboard
      expect(page.url()).toContain('/dashboard')
    })
  })

  describe('Session Management', () => {
    it('should persist session across page reloads', async () => {
      await e2eHelpers.login(testUser.email, testUser.password)
      
      // Reload page
      await page.reload()
      await e2eHelpers.waitForNavigation()
      
      // Should still be authenticated
      expect(page.url()).toContain('/dashboard')
    })

    it('should handle session expiry gracefully', async () => {
      await e2eHelpers.login(testUser.email, testUser.password)
      
      // Mock expired session
      await e2eHelpers.mockApiResponse(/supabase\.co.*auth/, {
        error: { message: 'JWT expired' }
      })
      
      // Try to access protected resource
      await e2eHelpers.goto('/dashboard/profile')
      
      // Should redirect to login
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/auth/login')
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility features on login page', async () => {
      await e2eHelpers.goto('/auth/login')
      
      const accessibility = await e2eHelpers.checkAccessibility()
      expect(accessibility.hasMainLandmark).toBe(true)
      expect(accessibility.hasHeadings).toBe(true)
    })

    it('should support keyboard navigation', async () => {
      await e2eHelpers.goto('/auth/login')
      
      // Tab through form elements
      await page.keyboard.press('Tab') // Email input
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('email-input')
      
      await page.keyboard.press('Tab') // Password input
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('password-input')
      
      await page.keyboard.press('Tab') // Login button
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('login-button')
    })
  })
})




