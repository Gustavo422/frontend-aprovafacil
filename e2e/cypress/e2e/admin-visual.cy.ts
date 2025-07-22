/// <reference types="cypress" />

describe('Admin Panel Visual Regression Tests', () => {
  const adminUser = {
    email: 'admin@aprovafacil.com',
    password: 'adminpassword123',
  };

  beforeEach(() => {
    // Mock auth responses
    cy.intercept('POST', /supabase\.co.*auth/, {
      statusCode: 200,
      body: {
        access_token: 'mock-admin-token',
        user: {
          id: 'mock-admin-id',
          email: adminUser.email,
          user_metadata: { 
            nome: 'Admin User',
            role: 'admin'
          }
        }
      }
    }).as('authLogin');

    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'mock-admin-id',
          email: adminUser.email,
          nome: 'Admin User',
          role: 'admin'
        }
      }
    }).as('authMe');

    // Login
    cy.login(adminUser.email, adminUser.password);
  });

  it('should visually match admin dashboard', () => {
    // Mock dashboard stats
    cy.intercept('GET', '/api/admin/dashboard', {
      statusCode: 200,
      body: {
        totalUsers: 1250,
        activeUsers: 876,
        totalConcursos: 45,
        totalCategorias: 120,
        totalApostilas: 350,
        recentActivity: [
          { type: 'user_registered', timestamp: new Date().toISOString() },
          { type: 'concurso_created', timestamp: new Date().toISOString() }
        ]
      }
    }).as('dashboardStats');

    // Navigate to admin panel
    cy.navigateToAdmin();
    cy.wait('@authMe');

    // Take snapshot of the entire dashboard
    cy.compareSnapshot('admin-dashboard-full', { capture: 'fullPage' });
    
    // Take snapshots of specific sections
    cy.get('h2:contains("Ações Rápidas")').parent().next().compareSnapshot('admin-quick-actions');
    cy.get('h2:contains("Funcionalidades Administrativas")').parent().next().compareSnapshot('admin-features');
    cy.get('h2:contains("Status do Sistema")').parent().next().compareSnapshot('admin-system-status');
    cy.get('h2:contains("Atividade Recente")').parent().next().compareSnapshot('admin-recent-activity');
  });

  it('should visually match user management page', () => {
    // Mock user list data
    cy.intercept('GET', '/api/admin/usuarios', {
      statusCode: 200,
      body: {
        usuarios: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            nome: 'Usuário Um',
            role: 'user',
            ativo: true,
            criado_em: '2023-01-01T00:00:00Z'
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            nome: 'Usuário Dois',
            role: 'user',
            ativo: false,
            criado_em: '2023-02-15T00:00:00Z'
          },
          {
            id: 'admin-1',
            email: 'admin1@example.com',
            nome: 'Administrador Um',
            role: 'admin',
            ativo: true,
            criado_em: '2022-12-01T00:00:00Z'
          }
        ]
      }
    }).as('userList');

    // Navigate to user management page
    cy.visit('/admin/usuarios');
    cy.wait('@authMe');
    cy.wait('@userList');
    
    // Take snapshot of the entire page
    cy.compareSnapshot('user-management-full', { capture: 'fullPage' });
    
    // Take snapshot of the user table
    cy.get('table').compareSnapshot('user-table');
  });

  it('should visually match database monitor page', () => {
    // Mock schema validation data
    cy.intercept('GET', '/api/admin/validate-schema', {
      statusCode: 200,
      body: {
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
      }
    }).as('validateSchema');
    
    // Mock usage report data
    cy.intercept('GET', '/api/admin/database-usage', {
      statusCode: 200,
      body: {
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
      }
    }).as('databaseUsage');
    
    // Mock benchmarks data
    cy.intercept('GET', '/api/admin/benchmarks', {
      statusCode: 200,
      body: {
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
      }
    }).as('benchmarks');

    // Navigate to database monitor page
    cy.visit('/admin/database-monitor');
    cy.wait('@authMe');
    cy.wait('@validateSchema');
    cy.wait('@databaseUsage');
    cy.wait('@benchmarks');
    
    // Take snapshot of the entire page
    cy.compareSnapshot('database-monitor-full', { capture: 'fullPage' });
    
    // Take snapshots of each tab
    cy.get('button[value="schema"]').click();
    cy.get('div[value="schema"]').compareSnapshot('database-schema-tab');
    
    cy.get('button[value="usage"]').click();
    cy.get('div[value="usage"]').compareSnapshot('database-usage-tab');
    
    cy.get('button[value="benchmarks"]').click();
    cy.get('div[value="benchmarks"]').compareSnapshot('database-benchmarks-tab');
  });

  it('should visually match e2e tests page', () => {
    // Mock test results data
    cy.intercept('GET', '/api/admin/e2e-tests', {
      statusCode: 200,
      body: {
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
      }
    }).as('e2eTests');
    
    // Navigate to e2e tests page
    cy.visit('/admin/e2e-tests');
    cy.wait('@authMe');
    cy.wait('@e2eTests');
    
    // Take snapshot of the entire page
    cy.compareSnapshot('e2e-tests-page-full', { capture: 'fullPage' });
    
    // Take snapshots of each tab
    cy.get('button[value="dashboard"]').click();
    cy.get('div[value="dashboard"]').compareSnapshot('e2e-tests-dashboard-tab');
    
    cy.get('button[value="suites"]').click();
    cy.get('div[value="suites"]').compareSnapshot('e2e-tests-suites-tab');
    
    cy.get('button[value="details"]').click();
    cy.get('div[value="details"]').compareSnapshot('e2e-tests-details-tab');
  });
});