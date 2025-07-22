import { test, expect } from '@playwright/test';

test.describe('Admin Panel Visual Tests', () => {
  const adminUser = {
    email: 'admin@aprovafacil.com',
    password: 'adminpassword123',
    nome: 'Admin User',
    role: 'admin'
  };

  test.beforeEach(async ({ page }) => {
    // Mock Supabase auth responses for admin user
    await page.route(/supabase\.co.*auth/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Mock auth/me response
    await page.route(/\/api\/auth\/me/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-admin-id',
            email: adminUser.email,
            nome: adminUser.nome,
            role: 'admin'
          }
        })
      });
    });
    
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', adminUser.email);
    await page.fill('[data-testid="password-input"]', adminUser.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
  });

  test('Admin Dashboard visual regression', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Mock dashboard stats
    await page.route(/\/api\/admin\/dashboard/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Reload to get mocked data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the entire dashboard
    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('span:has-text("há")')]
    });
    
    // Take screenshot of specific sections
    await expect(page.locator('h2:has-text("Ações Rápidas") + div')).toHaveScreenshot('admin-quick-actions.png');
    await expect(page.locator('h2:has-text("Funcionalidades Administrativas") + div')).toHaveScreenshot('admin-features.png');
    await expect(page.locator('h2:has-text("Status do Sistema") + div')).toHaveScreenshot('admin-system-status.png');
    await expect(page.locator('h2:has-text("Atividade Recente") + div')).toHaveScreenshot('admin-recent-activity.png');
  });

  test('User Management visual regression', async ({ page }) => {
    // Navigate to user management page
    await page.goto('/admin/usuarios');
    await page.waitForLoadState('networkidle');
    
    // Mock user list data
    await page.route(/\/api\/admin\/usuarios/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Reload to get mocked data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the user management page
    await expect(page).toHaveScreenshot('user-management.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('span:has-text("há")')]
    });
    
    // Take screenshot of the user table
    await expect(page.locator('table')).toHaveScreenshot('user-table.png');
  });

  test('Database Monitor visual regression', async ({ page }) => {
    // Navigate to database monitor page
    await page.goto('/admin/database-monitor');
    await page.waitForLoadState('networkidle');
    
    // Mock schema validation data
    await page.route(/\/api\/admin\/validate-schema/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Mock usage report data
    await page.route(/\/api\/admin\/database-usage/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Mock benchmarks data
    await page.route(/\/api\/admin\/benchmarks/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Reload to get mocked data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the database monitor page
    await expect(page).toHaveScreenshot('database-monitor.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('span:has-text("há")')]
    });
    
    // Take screenshots of each tab
    await page.click('button[value="schema"]');
    await expect(page.locator('div[value="schema"]')).toHaveScreenshot('database-schema-tab.png');
    
    await page.click('button[value="usage"]');
    await expect(page.locator('div[value="usage"]')).toHaveScreenshot('database-usage-tab.png');
    
    await page.click('button[value="benchmarks"]');
    await expect(page.locator('div[value="benchmarks"]')).toHaveScreenshot('database-benchmarks-tab.png');
  });

  test('E2E Tests Page visual regression', async ({ page }) => {
    // Navigate to e2e tests page
    await page.goto('/admin/e2e-tests');
    await page.waitForLoadState('networkidle');
    
    // Mock test results data
    await page.route(/\/api\/admin\/e2e-tests/, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });
    
    // Reload to get mocked data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the e2e tests page
    await expect(page).toHaveScreenshot('e2e-tests-page.png', {
      fullPage: true,
      mask: [page.locator('time'), page.locator('span:has-text("há")')]
    });
    
    // Take screenshots of each tab
    await page.click('button[value="dashboard"]');
    await expect(page.locator('div[value="dashboard"]')).toHaveScreenshot('e2e-tests-dashboard-tab.png');
    
    await page.click('button[value="suites"]');
    await expect(page.locator('div[value="suites"]')).toHaveScreenshot('e2e-tests-suites-tab.png');
    
    await page.click('button[value="details"]');
    await expect(page.locator('div[value="details"]')).toHaveScreenshot('e2e-tests-details-tab.png');
  });
});