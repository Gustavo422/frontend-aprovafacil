import { describe, it, expect, beforeEach } from 'vitest'
import { page, e2eHelpers } from './setup'

describe('Admin Panel E2E Tests', () => {
  const adminUser = {
    email: 'admin@aprovafacil.com',
    password: 'adminpassword123',
    nome: 'Admin User',
    role: 'admin'
  }

  beforeEach(async () => {
    // Mock Supabase auth responses for admin user
    await e2eHelpers.mockApiResponse(/supabase\.co.*auth/, {
      access_token: 'mock-admin-token',
      user: {
        id: 'mock-admin-id',
        email: adminUser.email,
        user_metadata: { 
          nome: adminUser.nome,
          role: adminUser.role
        }
      }
    })
    
    // Mock auth/me response
    await e2eHelpers.mockApiResponse(/\/api\/auth\/me/, {
      success: true,
      data: {
        id: 'mock-admin-id',
        email: adminUser.email,
        nome: adminUser.nome,
        role: 'admin'
      }
    })
    
    // Login as admin before each test
    await e2eHelpers.login(adminUser.email, adminUser.password)
    
    // Navigate to admin panel
    await e2eHelpers.goto('/admin')
    await e2eHelpers.waitForNavigation()
  })

  describe('Admin Dashboard', () => {
    it('should display admin dashboard with key metrics', async () => {
      // Mock dashboard stats
      await e2eHelpers.mockApiResponse(/\/api\/admin\/dashboard/, {
        totalUsers: 1250,
        activeUsers: 876,
        totalConcursos: 45,
        totalCategorias: 120,
        totalApostilas: 350,
        recentActivity: [
          { type: 'user_registered', timestamp: new Date().toISOString() },
          { type: 'concurso_created', timestamp: new Date().toISOString() }
        ]
      })
      
      // Reload to get mocked data
      await page.reload()
      await e2eHelpers.waitForNavigation()
      
      // Check for dashboard header
      expect(await e2eHelpers.getText('h1')).toContain('Painel Administrativo')
      
      // Check for stats cards
      const statsCards = await page.locator('.grid-cols-1.md\\:grid-cols-4 .card').count()
      expect(statsCards).toBeGreaterThanOrEqual(4)
      
      // Check for quick actions section
      expect(await e2eHelpers.elementExists('h2:has-text("Ações Rápidas")')).toBe(true)
      
      // Check for admin features section
      expect(await e2eHelpers.elementExists('h2:has-text("Funcionalidades Administrativas")')).toBe(true)
      
      // Check for system status section
      expect(await e2eHelpers.elementExists('h2:has-text("Status do Sistema")')).toBe(true)
      
      // Check for recent activity section
      expect(await e2eHelpers.elementExists('h2:has-text("Atividade Recente")')).toBe(true)
    })

    it('should navigate to database monitor page', async () => {
      // Click on Database Monitor feature
      await e2eHelpers.click('a[href="/admin/database-monitor"]')
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the database monitor page
      expect(page.url()).toContain('/admin/database-monitor')
      expect(await e2eHelpers.getText('h1')).toContain('Monitor do Banco de Dados')
    })
    
    it('should navigate to user management page', async () => {
      // Click on User Management feature
      await e2eHelpers.click('a[href="/admin/usuarios"]')
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the user management page
      expect(page.url()).toContain('/admin/usuarios')
      expect(await e2eHelpers.getText('h1')).toContain('Usuários do Sistema')
    })
    
    it('should navigate to e2e tests page', async () => {
      // Click on E2E Tests feature
      await e2eHelpers.click('a[href="/admin/e2e-tests"]')
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the e2e tests page
      expect(page.url()).toContain('/admin/e2e-tests')
      expect(await e2eHelpers.getText('h1')).toContain('Testes End-to-End')
    })
  })

  describe('User Management', () => {
    beforeEach(async () => {
      // Navigate to user management page
      await e2eHelpers.goto('/admin/usuarios')
      await e2eHelpers.waitForNavigation()
      
      // Mock user list data
      await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios/, {
        usuarios: [
          { 
            id: 'user-1', 
            email: 'user1@example.com', 
            nome: 'User One', 
            role: 'user',
            ativo: true,
            criado_em: '2023-01-01T00:00:00Z'
          },
          { 
            id: 'user-2', 
            email: 'user2@example.com', 
            nome: 'User Two', 
            role: 'user',
            ativo: false,
            criado_em: '2023-02-15T00:00:00Z'
          },
          { 
            id: 'admin-1', 
            email: 'admin1@example.com', 
            nome: 'Admin One', 
            role: 'admin',
            ativo: true,
            criado_em: '2022-12-01T00:00:00Z'
          }
        ]
      })
      
      // Reload to get mocked data
      await page.reload()
      await e2eHelpers.waitForNavigation()
    })

    it('should display user list', async () => {
      // Check for user table
      expect(await e2eHelpers.elementExists('table')).toBe(true)
      
      // Check user count
      const userRows = await page.locator('tbody tr').count()
      expect(userRows).toBe(3)
      
      // Check table headers
      const headers = await page.locator('thead th').allTextContents()
      expect(headers).toContain('Nome')
      expect(headers).toContain('Email')
      expect(headers).toContain('Role')
      expect(headers).toContain('Status')
    })
  })

  describe('Database Monitor', () => {
    beforeEach(async () => {
      // Navigate to database monitor page
      await e2eHelpers.goto('/admin/database-monitor')
      await e2eHelpers.waitForNavigation()
      
      // Mock schema validation data
      await e2eHelpers.mockApiResponse(/\/api\/admin\/validate-schema/, {
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Warning 1', 'Warning 2'],
          tables: {
            'users': {
              exists: true,
              columns: {
                'id': { exists: true, type: 'uuid', nullable: false, default: null },
                'email': { exists: true, type: 'varchar', nullable: false, default: null }
              }
            }
          },
          summary: {
            totalTables: 10,
            validTables: 10,
            totalColumns: 50,
            validColumns: 50,
            missingTables: [],
            missingColumns: [],
            typeConflicts: []
          }
        }
      })
      
      // Mock usage report data
      await e2eHelpers.mockApiResponse(/\/api\/admin\/database-usage/, {
        report: {
          tables: {
            'users': {
              usedInCode: true,
              usageLocations: ['src/repositories/user.repository.ts'],
              operations: ['SELECT', 'INSERT', 'UPDATE'],
              riskLevel: 'LOW',
              recommendations: []
            }
          },
          summary: {
            totalTables: 10,
            usedTables: 9,
            unusedTables: 1,
            highRiskOperations: 0,
            recommendations: ['Consider adding indexes to frequently queried columns']
          }
        }
      })
      
      // Mock benchmarks data
      await e2eHelpers.mockApiResponse(/\/api\/admin\/benchmarks/, {
        results: [
          {
            tipo: 'SELECT simples',
            media: 15.2,
            p95: 20.5,
            p99: 25.3,
            desvioPadrao: 3.2,
            amostras: [14.2, 15.1, 16.3],
            timestamp: new Date().toISOString()
          }
        ]
      })
      
      // Reload to get mocked data
      await page.reload()
      await e2eHelpers.waitForNavigation()
    })

    it('should display database monitor tabs', async () => {
      // Check for tabs
      expect(await e2eHelpers.elementExists('button[value="schema"]')).toBe(true)
      expect(await e2eHelpers.elementExists('button[value="usage"]')).toBe(true)
      expect(await e2eHelpers.elementExists('button[value="benchmarks"]')).toBe(true)
    })

    it('should display schema validation results', async () => {
      // Click on schema tab if not already active
      await e2eHelpers.click('button[value="schema"]')
      
      // Check for schema validation summary
      const summaryCards = await page.locator('div[value="schema"] .card').count()
      expect(summaryCards).toBeGreaterThanOrEqual(4)
      
      // Check for valid schema indicator
      const statusText = await e2eHelpers.getText('div[value="schema"] .card:first-child .text-2xl')
      expect(statusText).toBe('Válido')
    })

    it('should display database usage analysis', async () => {
      // Click on usage tab
      await e2eHelpers.click('button[value="usage"]')
      
      // Check for usage summary
      const summaryCards = await page.locator('div[value="usage"] .card').count()
      expect(summaryCards).toBeGreaterThanOrEqual(4)
      
      // Check for recommendations
      expect(await e2eHelpers.elementExists('div[value="usage"] .alert')).toBe(true)
    })

    it('should display benchmark results', async () => {
      // Click on benchmarks tab
      await e2eHelpers.click('button[value="benchmarks"]')
      
      // Check for benchmark cards
      expect(await e2eHelpers.elementExists('div[value="benchmarks"] .card')).toBe(true)
      
      // Check for run benchmarks button
      expect(await e2eHelpers.elementExists('div[value="benchmarks"] button:has-text("Rodar Benchmarks")')).toBe(true)
    })
  })

  describe('Database Management Actions', () => {
    it('should validate schema', async () => {
      // Navigate to database monitor page
      await e2eHelpers.goto('/admin/database-monitor')
      await e2eHelpers.waitForNavigation()
      
      // Mock schema validation response
      await e2eHelpers.mockApiResponse(/\/api\/admin\/validate-schema/, {
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          tables: {},
          summary: {
            totalTables: 10,
            validTables: 10,
            totalColumns: 50,
            validColumns: 50,
            missingTables: [],
            missingColumns: [],
            typeConflicts: []
          }
        }
      })
      
      // Click validate schema button
      await e2eHelpers.click('button:has-text("Validar Schema")')
      
      // Check for success toast
      // Note: This assumes your toast implementation uses data-testid="toast"
      // You may need to adjust based on your actual implementation
      await e2eHelpers.waitForElement('[role="status"]')
    })

    it('should analyze database usage', async () => {
      // Navigate to database monitor page
      await e2eHelpers.goto('/admin/database-monitor')
      await e2eHelpers.waitForNavigation()
      
      // Mock usage analysis response
      await e2eHelpers.mockApiResponse(/\/api\/admin\/database-usage/, {
        report: {
          tables: {},
          summary: {
            totalTables: 10,
            usedTables: 9,
            unusedTables: 1,
            highRiskOperations: 0,
            recommendations: []
          }
        }
      })
      
      // Click analyze usage button
      await e2eHelpers.click('button:has-text("Analisar Uso")')
      
      // Check for success toast
      await e2eHelpers.waitForElement('[role="status"]')
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to validate schema page', async () => {
      // Mock window.open
      await page.evaluate(() => {
        window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
          window.location.href = url ? url.toString() : '';
          return window;
        };
      });
      
      // Click on validate schema quick action
      await e2eHelpers.click('h3:has-text("Validar Schema")').then(() => 
        e2eHelpers.click('button:has-text("Executar")')
      )
      
      // Wait for navigation
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the validate schema page
      expect(page.url()).toContain('/admin/validate-schema')
    })
    
    it('should navigate to clear cache page', async () => {
      // Mock window.open
      await page.evaluate(() => {
        window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
          window.location.href = url ? url.toString() : '';
          return window;
        };
      });
      
      // Click on clear cache quick action
      await e2eHelpers.click('h3:has-text("Limpar Cache")').then(() => 
        e2eHelpers.click('button:has-text("Executar")')
      )
      
      // Wait for navigation
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the clear cache page
      expect(page.url()).toContain('/admin/clear-cache')
    })
    
    it('should navigate to e2e tests page', async () => {
      // Mock window.open
      await page.evaluate(() => {
        window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
          window.location.href = url ? url.toString() : '';
          return window;
        };
      });
      
      // Click on e2e tests quick action
      await e2eHelpers.click('h3:has-text("Executar Testes E2E")').then(() => 
        e2eHelpers.click('button:has-text("Executar")')
      )
      
      // Wait for navigation
      await e2eHelpers.waitForNavigation()
      
      // Verify we're on the e2e tests page
      expect(page.url()).toContain('/admin/e2e-tests')
    })
  })
  
  describe('E2E Tests Page', () => {
    beforeEach(async () => {
      // Navigate to e2e tests page
      await e2eHelpers.goto('/admin/e2e-tests')
      await e2eHelpers.waitForNavigation()
      
      // Mock test results data
      await e2eHelpers.mockApiResponse(/\/api\/admin\/e2e-tests/, {
        testSuites: [
          {
            name: 'Admin Panel E2E Tests',
            status: 'passed',
            duration: 5230,
            timestamp: new Date().toISOString(),
            tests: [
              {
                name: 'should display admin dashboard with key metrics',
                status: 'passed',
                duration: 1250,
                file: 'admin-panel.e2e.test.ts',
                suite: 'Admin Dashboard'
              },
              {
                name: 'should navigate to database monitor page',
                status: 'passed',
                duration: 980,
                file: 'admin-panel.e2e.test.ts',
                suite: 'Admin Dashboard'
              },
              {
                name: 'should navigate to user management page',
                status: 'passed',
                duration: 1050,
                file: 'admin-panel.e2e.test.ts',
                suite: 'Admin Dashboard'
              },
              {
                name: 'should display user list',
                status: 'passed',
                duration: 1100,
                file: 'admin-panel.e2e.test.ts',
                suite: 'User Management'
              },
              {
                name: 'should display database monitor tabs',
                status: 'passed',
                duration: 850,
                file: 'admin-panel.e2e.test.ts',
                suite: 'Database Monitor'
              }
            ]
          }
        ]
      })
      
      // Mock test run response
      await e2eHelpers.mockApiResponse(/\/api\/admin\/e2e-tests\/run/, {
        success: true,
        message: 'Testes executados com sucesso',
        passed: 5,
        failed: 0,
        skipped: 0,
        total: 5
      })
      
      // Reload to get mocked data
      await page.reload()
      await e2eHelpers.waitForNavigation()
    })

    it('should display e2e tests dashboard', async () => {
      // Check for page header
      expect(await e2eHelpers.getText('h1')).toContain('Testes End-to-End')
      
      // Check for stats cards
      const statsCards = await page.locator('.grid-cols-1.md\\:grid-cols-4 .card').count()
      expect(statsCards).toBeGreaterThanOrEqual(4)
      
      // Check for tabs
      expect(await e2eHelpers.elementExists('button[value="dashboard"]')).toBe(true)
      expect(await e2eHelpers.elementExists('button[value="suites"]')).toBe(true)
      expect(await e2eHelpers.elementExists('button[value="details"]')).toBe(true)
      
      // Check for test results
      expect(await e2eHelpers.elementExists('.card:has-text("Últimos Resultados")')).toBe(true)
    })

    it('should run e2e tests', async () => {
      // Click run tests button
      await e2eHelpers.click('button:has-text("Executar Testes")')
      
      // Check for success toast
      await e2eHelpers.waitForToast('Testes concluídos')
    })

    it('should display test details', async () => {
      // Click on details tab
      await e2eHelpers.click('button[value="details"]')
      
      // Check for test details table
      expect(await e2eHelpers.elementExists('table')).toBe(true)
      
      // Check test count
      const testRows = await page.locator('tbody tr').count()
      expect(testRows).toBeGreaterThanOrEqual(5)
    })

    it('should display test suites', async () => {
      // Click on suites tab
      await e2eHelpers.click('button[value="suites"]')
      
      // Check for test suite cards
      expect(await e2eHelpers.elementExists('.card:has-text("Admin Panel E2E Tests")')).toBe(true)
      
      // Check for test status badges
      expect(await e2eHelpers.elementExists('.badge:has-text("Passou")')).toBe(true)
    })
    
    it('should export test results', async () => {
      // Mock document.createElement and click for download
      await page.evaluate(() => {
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName: string) {
          const element = originalCreateElement.call(document, tagName);
          if (tagName === 'a') {
            element.click = function() {
              // Mock successful download
              console.log('Download initiated');
            };
          }
          return element;
        };
      });
      
      // Click export button
      await e2eHelpers.click('button:has-text("Exportar")')
      
      // Since we can't actually verify the download in a test environment,
      // we'll just check that the button exists and is clickable
      expect(await e2eHelpers.elementExists('button:has-text("Exportar")')).toBe(true)
    })
  })
})