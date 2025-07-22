import { describe, it, expect, beforeEach } from 'vitest'
import { page, e2eHelpers } from './setup'

describe('Dashboard E2E Tests', () => {
  const testUser = {
    email: 'test@aprovafacil.com',
    password: 'testpassword123',
    nome: 'Test User'
  }

  beforeEach(async () => {
    // Mock authentication
    await e2eHelpers.mockApiResponse(/supabase\.co.*auth/, {
      access_token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: testUser.email,
        user_metadata: { nome: testUser.nome }
      }
    })

    // Mock dashboard data
    await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
      data: [
        {
          id: '1',
          nome: 'Concurso Público Municipal',
          descricao: 'Concurso para diversos cargos',
          ano: 2024,
          banca: 'FCC',
          ativo: true,
          categoria_id: 'cat-1'
        }
      ]
    })

    await e2eHelpers.mockApiResponse(/supabase\.co.*apostilas/, {
      data: [
        {
          id: '1',
          titulo: 'Apostila de Português',
          descricao: 'Material completo de português',
          concurso_id: '1',
          ativo: true
        }
      ]
    })

    // Login before each test
    await e2eHelpers.login(testUser.email, testUser.password)
  })

  describe('Dashboard Layout', () => {
    it('should display main dashboard components', async () => {
      await e2eHelpers.goto('/dashboard')
      
      expect(await e2eHelpers.elementExists('[data-testid="sidebar"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="main-content"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="user-menu"]')).toBe(true)
    })

    it('should display user information', async () => {
      await e2eHelpers.goto('/dashboard')
      
      const usernome = await e2eHelpers.getText('[data-testid="user-nome"]')
      expect(usernome).toContain(testUser.nome)
    })

    it('should have working navigation menu', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Check navigation items
      expect(await e2eHelpers.elementExists('[data-testid="nav-concursos"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="nav-apostilas"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="nav-simulados"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="nav-flashcards"]')).toBe(true)
    })
  })

  describe('Dashboard Overview', () => {
    it('should display statistics cards', async () => {
      await e2eHelpers.goto('/dashboard')
      
      expect(await e2eHelpers.elementExists('[data-testid="stats-concursos"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="stats-apostilas"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="stats-simulados"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="stats-progresso"]')).toBe(true)
    })

    it('should display recent activities', async () => {
      await e2eHelpers.goto('/dashboard')
      
      expect(await e2eHelpers.elementExists('[data-testid="recent-activities"]')).toBe(true)
    })

    it('should display progress charts', async () => {
      await e2eHelpers.goto('/dashboard')
      
      expect(await e2eHelpers.elementExists('[data-testid="progress-chart"]')).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('should navigate to concursos page', async () => {
      await e2eHelpers.goto('/dashboard')
      await e2eHelpers.click('[data-testid="nav-concursos"]')
      
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/concursos')
    })

    it('should navigate to apostilas page', async () => {
      await e2eHelpers.goto('/dashboard')
      await e2eHelpers.click('[data-testid="nav-apostilas"]')
      
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/apostilas')
    })

    it('should navigate to simulados page', async () => {
      await e2eHelpers.goto('/dashboard')
      await e2eHelpers.click('[data-testid="nav-simulados"]')
      
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/simulados')
    })

    it('should navigate to flashcards page', async () => {
      await e2eHelpers.goto('/dashboard')
      await e2eHelpers.click('[data-testid="nav-flashcards"]')
      
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/flashcards')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await e2eHelpers.goto('/dashboard')
      
      // Mobile menu should be present
      expect(await e2eHelpers.elementExists('[data-testid="mobile-menu-button"]')).toBe(true)
      
      // Sidebar should be hidden by default on mobile
      const sidebar = page.locator('[data-testid="sidebar"]')
      expect(await sidebar.isVisible()).toBe(false)
    })

    it('should toggle mobile menu', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await e2eHelpers.goto('/dashboard')
      
      // Open mobile menu
      await e2eHelpers.click('[data-testid="mobile-menu-button"]')
      
      // Sidebar should be visible
      const sidebar = page.locator('[data-testid="sidebar"]')
      expect(await sidebar.isVisible()).toBe(true)
    })

    it('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await e2eHelpers.goto('/dashboard')
      
      // Should display properly on tablet
      expect(await e2eHelpers.elementExists('[data-testid="sidebar"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="main-content"]')).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('should have global search', async () => {
      await e2eHelpers.goto('/dashboard')
      
      expect(await e2eHelpers.elementExists('[data-testid="global-search"]')).toBe(true)
    })

    it('should search for content', async () => {
      await e2eHelpers.goto('/dashboard')
      
      await e2eHelpers.fillField('[data-testid="global-search"]', 'português')
      await page.keyboard.press('Enter')
      
      // Should show search results
      await e2eHelpers.waitForElement('[data-testid="search-results"]')
    })
  })

  describe('User Menu', () => {
    it('should open user menu', async () => {
      await e2eHelpers.goto('/dashboard')
      
      await e2eHelpers.click('[data-testid="user-menu"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="user-menu-dropdown"]')).toBe(true)
    })

    it('should have profile link in user menu', async () => {
      await e2eHelpers.goto('/dashboard')
      
      await e2eHelpers.click('[data-testid="user-menu"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="profile-link"]')).toBe(true)
    })

    it('should have settings link in user menu', async () => {
      await e2eHelpers.goto('/dashboard')
      
      await e2eHelpers.click('[data-testid="user-menu"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="settings-link"]')).toBe(true)
    })

    it('should have logout button in user menu', async () => {
      await e2eHelpers.goto('/dashboard')
      
      await e2eHelpers.click('[data-testid="user-menu"]')
      
      expect(await e2eHelpers.elementExists('[data-testid="logout-button"]')).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching data', async () => {
      // Mock slow API response
      await page.route(/supabase\.co.*concursos/, async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] })
        })
      })

      await e2eHelpers.goto('/dashboard')
      
      // Should show loading state
      expect(await e2eHelpers.elementExists('[data-testid="dashboard-loading"]')).toBe(true)
    })

    it('should hide loading state after data loads', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Wait for loading to finish
      await e2eHelpers.waitForLoading()
      
      // Loading should be hidden
      expect(await e2eHelpers.elementExists('[data-testid="dashboard-loading"]')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
        error: { message: 'Internal server error' }
      })

      await e2eHelpers.goto('/dashboard')
      
      // Should show error message
      await e2eHelpers.waitForElement('[data-testid="error-message"]')
    })

    it('should have retry functionality on error', async () => {
      // Mock API error first, then success
      let callCount = 0
      await page.route(/supabase\.co.*concursos/, async route => {
        callCount++
        if (callCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: { message: 'Server error' } })
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] })
          })
        }
      })

      await e2eHelpers.goto('/dashboard')
      
      // Should show error and retry button
      await e2eHelpers.waitForElement('[data-testid="retry-button"]')
      await e2eHelpers.click('[data-testid="retry-button"]')
      
      // Should load successfully after retry
      await e2eHelpers.waitForLoading()
    })
  })

  describe('Performance', () => {
    it('should load dashboard within acceptable time', async () => {
      const startTime = Date.now()
      await e2eHelpers.goto('/dashboard')
      await e2eHelpers.waitForLoading()
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Check for ARIA labels on interactive elements
      const menuButton = page.locator('[data-testid="user-menu"]')
      expect(await menuButton.getAttribute('aria-label')).toBeTruthy()
      
      const searchInput = page.locator('[data-testid="global-search"]')
      expect(await searchInput.getAttribute('aria-label')).toBeTruthy()
    })

    it('should support keyboard navigation', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Tab through navigation items
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to activate navigation with Enter
      await page.keyboard.press('Enter')
      
      // Should navigate to the selected page
      await e2eHelpers.waitForNavigation()
    })

    it('should have proper heading hierarchy', async () => {
      await e2eHelpers.goto('/dashboard')
      
      // Should have h1 for main heading
      expect(await e2eHelpers.elementExists('h1')).toBe(true)
      
      // Should have proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
      expect(headings).toBeGreaterThan(0)
    })
  })
})




