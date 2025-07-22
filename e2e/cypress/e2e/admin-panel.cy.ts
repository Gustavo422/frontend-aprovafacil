describe('Admin Panel', () => {
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

  it('should display admin dashboard', () => {
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

    // Check for dashboard header
    cy.get('h1').should('contain', 'Painel Administrativo');
    
    // Check for stats cards
    cy.get('.grid-cols-1.md\\:grid-cols-4 .card').should('have.length.at.least', 4);
    
    // Check for sections
    cy.get('h2').contains('Ações Rápidas').should('be.visible');
    cy.get('h2').contains('Funcionalidades Administrativas').should('be.visible');
    cy.get('h2').contains('Status do Sistema').should('be.visible');
    cy.get('h2').contains('Atividade Recente').should('be.visible');
    
    // Take snapshot for visual testing
    cy.compareSnapshot('admin-dashboard', { capture: 'viewport' });
  });

  it('should navigate to database monitor page', () => {
    cy.navigateToAdmin();
    cy.get('a[href="/admin/database-monitor"]').click();
    cy.url().should('include', '/admin/database-monitor');
    cy.get('h1').should('contain', 'Monitor do Banco de Dados');
    
    // Take snapshot for visual testing
    cy.compareSnapshot('database-monitor', { capture: 'viewport' });
  });
  
  it('should navigate to user management page', () => {
    cy.navigateToAdmin();
    cy.get('a[href="/admin/usuarios"]').click();
    cy.url().should('include', '/admin/usuarios');
    cy.get('h1').should('contain', 'Usuários do Sistema');
    
    // Take snapshot for visual testing
    cy.compareSnapshot('user-management', { capture: 'viewport' });
  });
  
  it('should navigate to e2e tests page', () => {
    cy.navigateToAdmin();
    cy.get('a[href="/admin/e2e-tests"]').click();
    cy.url().should('include', '/admin/e2e-tests');
    cy.get('h1').should('contain', 'Testes End-to-End');
    
    // Take snapshot for visual testing
    cy.compareSnapshot('e2e-tests-page', { capture: 'viewport' });
  });
});