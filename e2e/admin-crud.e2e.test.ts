import { describe, it, expect, beforeEach } from 'vitest';
import { page, e2eHelpers } from './setup';

describe('Admin Panel CRUD Operations', () => {
    const adminUser = {
        email: 'admin@aprovafacil.com',
        password: 'adminpassword123',
        nome: 'Admin User',
        role: 'admin'
    };

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
        });

        // Mock auth/me response
        await e2eHelpers.mockApiResponse(/\/api\/auth\/me/, {
            success: true,
            data: {
                id: 'mock-admin-id',
                email: adminUser.email,
                nome: adminUser.nome,
                role: 'admin'
            }
        });

        // Login as admin before each test
        await e2eHelpers.login(adminUser.email, adminUser.password);
    });

    describe('User CRUD Operations', () => {
        beforeEach(async () => {
            // Navigate to user management page
            await e2eHelpers.goto('/admin/usuarios');
            await e2eHelpers.waitForNavigation();

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
                    }
                ]
            });

            // Reload to get mocked data
            await page.reload();
            await e2eHelpers.waitForNavigation();
        });

        it('should create a new user', async () => {
            // Mock create user response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios\/create/, {
                success: true,
                data: {
                    id: 'new-user-id',
                    email: 'newuser@example.com',
                    nome: 'New User',
                    role: 'user',
                    ativo: true,
                    criado_em: new Date().toISOString()
                }
            });

            // Click on create user button
            await e2eHelpers.click('button:has-text("Adicionar Usuário")');

            // Fill the form
            await e2eHelpers.fillField('input[name="nome"]', 'New User');
            await e2eHelpers.fillField('input[name="email"]', 'newuser@example.com');
            await e2eHelpers.fillField('input[name="password"]', 'password123');
            await e2eHelpers.click('button:has-text("Salvar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Usuário criado com sucesso');

            // Mock updated user list to include the new user
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
                        id: 'new-user-id',
                        email: 'newuser@example.com',
                        nome: 'New User',
                        role: 'user',
                        ativo: true,
                        criado_em: new Date().toISOString()
                    }
                ]
            });

            // Reload to get updated user list
            await page.reload();
            await e2eHelpers.waitForNavigation();

            // Check if new user is in the list
            expect(await e2eHelpers.elementExists('tr:has-text("New User")')).toBe(true);
        });

        it('should update an existing user', async () => {
            // Mock get user details response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios\/user-1/, {
                success: true,
                data: {
                    id: 'user-1',
                    email: 'user1@example.com',
                    nome: 'User One',
                    role: 'user',
                    ativo: true,
                    criado_em: '2023-01-01T00:00:00Z'
                }
            });

            // Mock update user response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios\/update/, {
                success: true,
                data: {
                    id: 'user-1',
                    email: 'user1@example.com',
                    nome: 'Updated User One',
                    role: 'user',
                    ativo: true,
                    criado_em: '2023-01-01T00:00:00Z'
                }
            });

            // Click on edit button for the first user
            await e2eHelpers.click('tr:has-text("User One") button:has-text("Editar")');

            // Update the name
            await e2eHelpers.fillField('input[name="nome"]', 'Updated User One');
            await e2eHelpers.click('button:has-text("Salvar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Usuário atualizado com sucesso');

            // Mock updated user list
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios/, {
                usuarios: [
                    {
                        id: 'user-1',
                        email: 'user1@example.com',
                        nome: 'Updated User One',
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
                    }
                ]
            });

            // Reload to get updated user list
            await page.reload();
            await e2eHelpers.waitForNavigation();

            // Check if user name is updated
            expect(await e2eHelpers.elementExists('tr:has-text("Updated User One")')).toBe(true);
            expect(await e2eHelpers.elementExists('tr:has-text("User One")')).toBe(false);
        });

        it('should delete a user', async () => {
            // Mock delete user response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios\/delete/, {
                success: true
            });

            // Click on delete button for the first user
            await e2eHelpers.click('tr:has-text("User One") button:has-text("Excluir")');

            // Confirm deletion
            await e2eHelpers.click('button:has-text("Confirmar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Usuário excluído com sucesso');

            // Mock updated user list without the deleted user
            await e2eHelpers.mockApiResponse(/\/api\/admin\/usuarios/, {
                usuarios: [
                    {
                        id: 'user-2',
                        email: 'user2@example.com',
                        nome: 'User Two',
                        role: 'user',
                        ativo: false,
                        criado_em: '2023-02-15T00:00:00Z'
                    }
                ]
            });

            // Reload to get updated user list
            await page.reload();
            await e2eHelpers.waitForNavigation();

            // Check if user is removed from the list
            expect(await e2eHelpers.elementExists('tr:has-text("User One")')).toBe(false);
        });
    });

    describe('Concurso CRUD Operations', () => {
        beforeEach(async () => {
            // Navigate to concursos management page
            await e2eHelpers.goto('/admin/concursos');
            await e2eHelpers.waitForNavigation();

            // Mock concursos list data
            await e2eHelpers.mockApiResponse(/\/api\/admin\/concursos/, {
                concursos: [
                    {
                        id: 'concurso-1',
                        titulo: 'Concurso One',
                        descricao: 'Descrição do Concurso One',
                        data_inicio: '2023-01-01T00:00:00Z',
                        data_fim: '2023-12-31T00:00:00Z',
                        ativo: true
                    },
                    {
                        id: 'concurso-2',
                        titulo: 'Concurso Two',
                        descricao: 'Descrição do Concurso Two',
                        data_inicio: '2023-02-01T00:00:00Z',
                        data_fim: '2023-11-30T00:00:00Z',
                        ativo: false
                    }
                ]
            });

            // Reload to get mocked data
            await page.reload();
            await e2eHelpers.waitForNavigation();
        });

        it('should create a new concurso', async () => {
            // Mock create concurso response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/concursos\/create/, {
                success: true,
                data: {
                    id: 'new-concurso-id',
                    titulo: 'Novo Concurso',
                    descricao: 'Descrição do Novo Concurso',
                    data_inicio: '2023-07-01T00:00:00Z',
                    data_fim: '2023-12-31T00:00:00Z',
                    ativo: true
                }
            });

            // Click on create concurso button
            await e2eHelpers.click('button:has-text("Adicionar Concurso")');

            // Fill the form
            await e2eHelpers.fillField('input[name="titulo"]', 'Novo Concurso');
            await e2eHelpers.fillField('textarea[name="descricao"]', 'Descrição do Novo Concurso');
            await e2eHelpers.fillField('input[name="data_inicio"]', '2023-07-01');
            await e2eHelpers.fillField('input[name="data_fim"]', '2023-12-31');
            await e2eHelpers.click('button:has-text("Salvar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Concurso criado com sucesso');

            // Mock updated concursos list to include the new concurso
            await e2eHelpers.mockApiResponse(/\/api\/admin\/concursos/, {
                concursos: [
                    {
                        id: 'concurso-1',
                        titulo: 'Concurso One',
                        descricao: 'Descrição do Concurso One',
                        data_inicio: '2023-01-01T00:00:00Z',
                        data_fim: '2023-12-31T00:00:00Z',
                        ativo: true
                    },
                    {
                        id: 'concurso-2',
                        titulo: 'Concurso Two',
                        descricao: 'Descrição do Concurso Two',
                        data_inicio: '2023-02-01T00:00:00Z',
                        data_fim: '2023-11-30T00:00:00Z',
                        ativo: false
                    },
                    {
                        id: 'new-concurso-id',
                        titulo: 'Novo Concurso',
                        descricao: 'Descrição do Novo Concurso',
                        data_inicio: '2023-07-01T00:00:00Z',
                        data_fim: '2023-12-31T00:00:00Z',
                        ativo: true
                    }
                ]
            });

            // Reload to get updated concursos list
            await page.reload();
            await e2eHelpers.waitForNavigation();

            // Check if new concurso is in the list
            expect(await e2eHelpers.elementExists('tr:has-text("Novo Concurso")')).toBe(true);
        });
    });

    describe('Categoria CRUD Operations', () => {
        beforeEach(async () => {
            // Navigate to categorias management page
            await e2eHelpers.goto('/admin/categorias');
            await e2eHelpers.waitForNavigation();

            // Mock categorias list data
            await e2eHelpers.mockApiResponse(/\/api\/admin\/categorias/, {
                categorias: [
                    {
                        id: 'categoria-1',
                        nome: 'Categoria One',
                        descricao: 'Descrição da Categoria One',
                        parent_id: null,
                        ordem: 1
                    },
                    {
                        id: 'categoria-2',
                        nome: 'Categoria Two',
                        descricao: 'Descrição da Categoria Two',
                        parent_id: 'categoria-1',
                        ordem: 1
                    }
                ]
            });

            // Reload to get mocked data
            await page.reload();
            await e2eHelpers.waitForNavigation();
        });

        it('should create a new categoria', async () => {
            // Mock create categoria response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/categorias\/create/, {
                success: true,
                data: {
                    id: 'new-categoria-id',
                    nome: 'Nova Categoria',
                    descricao: 'Descrição da Nova Categoria',
                    parent_id: 'categoria-1',
                    ordem: 2
                }
            });

            // Click on create categoria button
            await e2eHelpers.click('button:has-text("Adicionar Categoria")');

            // Fill the form
            await e2eHelpers.fillField('input[name="nome"]', 'Nova Categoria');
            await e2eHelpers.fillField('textarea[name="descricao"]', 'Descrição da Nova Categoria');
            await e2eHelpers.selectOption('select[name="parent_id"]', 'categoria-1');
            await e2eHelpers.fillField('input[name="ordem"]', '2');
            await e2eHelpers.click('button:has-text("Salvar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Categoria criada com sucesso');
        });
    });

    describe('Apostila CRUD Operations', () => {
        beforeEach(async () => {
            // Navigate to apostilas management page
            await e2eHelpers.goto('/admin/apostilas');
            await e2eHelpers.waitForNavigation();

            // Mock apostilas list data
            await e2eHelpers.mockApiResponse(/\/api\/admin\/apostilas/, {
                apostilas: [
                    {
                        id: 'apostila-1',
                        titulo: 'Apostila One',
                        descricao: 'Descrição da Apostila One',
                        categoria_id: 'categoria-1',
                        autor: 'Autor One',
                        data_publicacao: '2023-01-01T00:00:00Z'
                    },
                    {
                        id: 'apostila-2',
                        titulo: 'Apostila Two',
                        descricao: 'Descrição da Apostila Two',
                        categoria_id: 'categoria-2',
                        autor: 'Autor Two',
                        data_publicacao: '2023-02-01T00:00:00Z'
                    }
                ]
            });

            // Reload to get mocked data
            await page.reload();
            await e2eHelpers.waitForNavigation();
        });

        it('should create a new apostila', async () => {
            // Mock create apostila response
            await e2eHelpers.mockApiResponse(/\/api\/admin\/apostilas\/create/, {
                success: true,
                data: {
                    id: 'new-apostila-id',
                    titulo: 'Nova Apostila',
                    descricao: 'Descrição da Nova Apostila',
                    categoria_id: 'categoria-1',
                    autor: 'Novo Autor',
                    data_publicacao: '2023-07-01T00:00:00Z'
                }
            });

            // Click on create apostila button
            await e2eHelpers.click('button:has-text("Adicionar Apostila")');

            // Fill the form
            await e2eHelpers.fillField('input[name="titulo"]', 'Nova Apostila');
            await e2eHelpers.fillField('textarea[name="descricao"]', 'Descrição da Nova Apostila');
            await e2eHelpers.selectOption('select[name="categoria_id"]', 'categoria-1');
            await e2eHelpers.fillField('input[name="autor"]', 'Novo Autor');
            await e2eHelpers.fillField('input[name="data_publicacao"]', '2023-07-01');
            await e2eHelpers.click('button:has-text("Salvar")');

            // Check for success toast
            await e2eHelpers.waitForToast('Apostila criada com sucesso');
        });
    });
});