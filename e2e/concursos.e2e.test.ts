import { describe, it, expect, beforeEach } from 'vitest'
import { page, e2eHelpers } from './setup'

describe('Concursos E2E Tests', () => {
  const testUser = {
    email: 'test@aprovafacil.com',
    password: 'testpassword123',
    name: 'Test User'
  }

  const mockConcursos = [
    {
      id: '1',
      nome: 'Concurso Público Municipal',
      descricao: 'Concurso para diversos cargos municipais',
      ano: 2024,
      banca: 'FCC',
      is_active: true,
      categoria_id: 'cat-1',
      edital_url: 'https://example.com/edital.pdf',
      data_prova: '2024-12-15',
      vagas: 100,
      salario: 5000
    },
    {
      id: '2',
      nome: 'Concurso Estadual',
      descricao: 'Concurso para cargos estaduais',
      ano: 2024,
      banca: 'CESPE',
      is_active: true,
      categoria_id: 'cat-2',
      edital_url: 'https://example.com/edital2.pdf',
      data_prova: '2024-11-20',
      vagas: 50,
      salario: 7000
    }
  ]

  beforeEach(async () => {
    // Mock authentication
    await e2eHelpers.mockApiResponse(/supabase\.co.*auth/, {
      access_token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: testUser.email,
        user_metadata: { name: testUser.name }
      }
    })

    // Mock concursos data
    await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
      data: mockConcursos,
      count: mockConcursos.length
    })

    // Mock categorias data
    await e2eHelpers.mockApiResponse(/supabase\.co.*concurso_categorias/, {
      data: [
        { id: 'cat-1', nome: 'Municipal', slug: 'municipal' },
        { id: 'cat-2', nome: 'Estadual', slug: 'estadual' }
      ]
    })

    // Login before each test
    await e2eHelpers.login(testUser.email, testUser.password)
  })

  describe('Concursos List Page', () => {
    it('should display concursos list', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="concursos-list"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-item-1"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-item-2"]')).toBe(true)
    })

    it('should display concurso information correctly', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      const concursoName = await e2eHelpers.getText('[data-testid="concurso-name-1"]')
      expect(concursoName).toContain('Concurso Público Municipal')
      
      const concursoBanca = await e2eHelpers.getText('[data-testid="concurso-banca-1"]')
      expect(concursoBanca).toContain('FCC')
    })

    it('should have search functionality', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="concursos-search"]')).toBe(true)
    })

    it('should filter concursos by search term', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      await e2eHelpers.fillField('[data-testid="concursos-search"]', 'Municipal')
      await page.keyboard.press('Enter')
      
      // Should show only municipal concurso
      expect(await e2eHelpers.elementExists('[data-testid="concurso-item-1"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-item-2"]')).toBe(false)
    })

    it('should have filter by category', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="category-filter"]')).toBe(true)
    })

    it('should filter concursos by category', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      await e2eHelpers.selectOption('[data-testid="category-filter"]', 'cat-1')
      
      // Should show only municipal concurso
      await e2eHelpers.waitForElement('[data-testid="concurso-item-1"]')
      expect(await e2eHelpers.elementExists('[data-testid="concurso-item-2"]')).toBe(false)
    })

    it('should have filter by banca', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="banca-filter"]')).toBe(true)
    })

    it('should sort concursos', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="sort-select"]')).toBe(true)
      
      await e2eHelpers.selectOption('[data-testid="sort-select"]', 'nome')
      
      // Should reorder the list
      await e2eHelpers.waitForElement('[data-testid="concursos-list"]')
    })
  })

  describe('Concurso Detail Page', () => {
    it('should navigate to concurso detail', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      await e2eHelpers.click('[data-testid="concurso-item-1"]')
      
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/concursos/1')
    })

    it('should display concurso details', async () => {
      await e2eHelpers.goto('/dashboard/concursos/1')
      
      expect(await e2eHelpers.elementExists('[data-testid="concurso-detail"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-title"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-description"]')).toBe(true)
      expect(await e2eHelpers.elementExists('[data-testid="concurso-info"]')).toBe(true)
    })

    it('should display concurso information correctly', async () => {
      await e2eHelpers.goto('/dashboard/concursos/1')
      
      const title = await e2eHelpers.getText('[data-testid="concurso-title"]')
      expect(title).toContain('Concurso Público Municipal')
      
      const banca = await e2eHelpers.getText('[data-testid="concurso-banca"]')
      expect(banca).toContain('FCC')
      
      const vagas = await e2eHelpers.getText('[data-testid="concurso-vagas"]')
      expect(vagas).toContain('100')
    })

    it('should have edital download link', async () => {
      await e2eHelpers.goto('/dashboard/concursos/1')
      
      expect(await e2eHelpers.elementExists('[data-testid="edital-link"]')).toBe(true)
      
      const editalLink = page.locator('[data-testid="edital-link"]')
      expect(await editalLink.getAttribute('href')).toContain('edital.pdf')
    })

    it('should display related apostilas', async () => {
      // Mock apostilas for this concurso
      await e2eHelpers.mockApiResponse(/supabase\.co.*apostilas.*concurso_id/, {
        data: [
          {
            id: 'ap-1',
            title: 'Apostila de Português',
            description: 'Material completo',
            concurso_id: '1'
          }
        ]
      })

      await e2eHelpers.goto('/dashboard/concursos/1')
      
      expect(await e2eHelpers.elementExists('[data-testid="related-apostilas"]')).toBe(true)
    })

    it('should display related simulados', async () => {
      // Mock simulados for this concurso
      await e2eHelpers.mockApiResponse(/supabase\.co.*simulados.*concurso_id/, {
        data: [
          {
            id: 'sim-1',
            titulo: 'Simulado Geral',
            descricao: 'Simulado completo',
            concurso_id: '1'
          }
        ]
      })

      await e2eHelpers.goto('/dashboard/concursos/1')
      
      expect(await e2eHelpers.elementExists('[data-testid="related-simulados"]')).toBe(true)
    })
  })

  describe('Concurso Selection', () => {
    it('should allow selecting a concurso as preference', async () => {
      await e2eHelpers.goto('/dashboard/concursos/1')
      
      expect(await e2eHelpers.elementExists('[data-testid="select-concurso-button"]')).toBe(true)
      
      await e2eHelpers.click('[data-testid="select-concurso-button"]')
      
      await e2eHelpers.waitForToast('Concurso selecionado como preferência')
    })

    it('should show selected concurso in user preferences', async () => {
      // Mock user preferences
      await e2eHelpers.mockApiResponse(/supabase\.co.*user_concurso_preferences/, {
        data: [
          {
            id: 'pref-1',
            user_id: 'mock-user-id',
            concurso_id: '1',
            is_active: true
          }
        ]
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="selected-concurso-1"]')).toBe(true)
    })
  })

  describe('Pagination', () => {
    it('should display pagination when there are many concursos', async () => {
      // Mock many concursos
      const manyConcursos = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        nome: `Concurso ${i + 1}`,
        descricao: `Descrição ${i + 1}`,
        ano: 2024,
        banca: 'FCC',
        is_active: true,
        categoria_id: 'cat-1'
      }))

      await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
        data: manyConcursos.slice(0, 10),
        count: manyConcursos.length
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="pagination"]')).toBe(true)
    })

    it('should navigate to next page', async () => {
      // Mock paginated data
      await page.route(/supabase\.co.*concursos.*range=0,9/, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockConcursos.slice(0, 1),
            count: 25
          })
        })
      })

      await page.route(/supabase\.co.*concursos.*range=10,19/, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockConcursos.slice(1, 2),
            count: 25
          })
        })
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      await e2eHelpers.click('[data-testid="next-page"]')
      
      // Should load next page data
      await e2eHelpers.waitForElement('[data-testid="concursos-list"]')
    })
  })

  describe('Loading States', () => {
    it('should show loading state while fetching concursos', async () => {
      // Mock slow API response
      await page.route(/supabase\.co.*concursos/, async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockConcursos })
        })
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="concursos-loading"]')).toBe(true)
    })

    it('should show skeleton loading for concurso items', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      // Should show skeleton while loading
      expect(await e2eHelpers.elementExists('[data-testid="concurso-skeleton"]')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
        error: { message: 'Failed to fetch concursos' }
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="error-message"]')).toBe(true)
    })

    it('should show empty state when no concursos found', async () => {
      await e2eHelpers.mockApiResponse(/supabase\.co.*concursos/, {
        data: [],
        count: 0
      })

      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('[data-testid="empty-state"]')).toBe(true)
    })

    it('should handle 404 for non-existent concurso', async () => {
      await e2eHelpers.mockApiResponse(/supabase\.co.*concursos.*eq.*999/, {
        data: null,
        error: { message: 'Not found' }
      })

      await e2eHelpers.goto('/dashboard/concursos/999')
      
      expect(await e2eHelpers.elementExists('[data-testid="not-found"]')).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await e2eHelpers.goto('/dashboard/concursos')
      
      // Should display mobile-friendly layout
      expect(await e2eHelpers.elementExists('[data-testid="concursos-list"]')).toBe(true)
    })

    it('should stack filters vertically on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await e2eHelpers.goto('/dashboard/concursos')
      
      // Filters should be stacked
      const filtersContainer = page.locator('[data-testid="filters-container"]')
      expect(await filtersContainer.isVisible()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      const searchInput = page.locator('[data-testid="concursos-search"]')
      expect(await searchInput.getAttribute('aria-label')).toBeTruthy()
      
      const filterSelect = page.locator('[data-testid="category-filter"]')
      expect(await filterSelect.getAttribute('aria-label')).toBeTruthy()
    })

    it('should support keyboard navigation', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      // Tab to first concurso item
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter')
      
      // Should navigate to detail page
      await e2eHelpers.waitForNavigation()
      expect(page.url()).toContain('/dashboard/concursos/')
    })

    it('should have proper heading structure', async () => {
      await e2eHelpers.goto('/dashboard/concursos')
      
      expect(await e2eHelpers.elementExists('h1')).toBe(true)
      expect(await e2eHelpers.elementExists('h2')).toBe(true)
    })
  })
})

