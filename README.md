# Aprova Fácil - Frontend

Plataforma moderna de estudos para concursos públicos, desenvolvida com Next.js, TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Framework**: Next.js 15.3.4
- **Linguagem**: TypeScript 5.8.3
- **Estilização**: Tailwind CSS + Radix UI
- **Backend**: Supabase
- **Estado**: Zustand + TanStack Query
- **Testes**: Vitest + Playwright
- **Linting**: ESLint + Prettier
- **CI/CD**: Husky + Lint-staged

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Conta no Supabase

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd aprova-facil-frontend
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha as variáveis no `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Execute o projeto:
```bash
npm run dev
```

## 🗄️ Banco de Dados

O projeto utiliza Supabase como backend. Execute as migrações SQL fornecidas no arquivo `schema_public_and_auth.sql` no seu projeto Supabase.

### Principais Tabelas:
- `usuarios` - Usuários do sistema
- `concursos` - Concursos públicos
- `categorias_concursos` - Categorias de concursos
- `apostilas` - Material de estudo
- `apostila_content` - Conteúdo das apostilas
- `simulados` - Simulados e provas
- `questoes` - Questões dos simulados
- `flashcards` - Cards de estudo
- `user_progress` - Progresso dos usuários

## 🧪 Testes

### Testes Unitários e de Integração
```bash
# Executar todos os testes
npm run test

# Executar em modo watch
npm run test:watch

# Executar com coverage
npm run test:coverage

# Interface visual dos testes
npm run test:ui
```

### Testes E2E
```bash
# Testes E2E com Vitest
npm run test:e2e

# Testes E2E com Playwright
npm run test:playwright

# Interface visual do Playwright
npm run test:playwright:ui

# Debug dos testes
npm run test:playwright:debug
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 13+)
├── components/             # Componentes reutilizáveis
│   ├── ui/                # Componentes base (Radix UI)
│   └── ...
├── features/              # Features organizadas por domínio
│   ├── auth/              # Autenticação
│   ├── concursos/         # Concursos
│   ├── apostilas/         # Apostilas
│   ├── simulados/         # Simulados
│   └── flashcards/        # Flashcards
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários e configurações
│   ├── supabase/          # Cliente e utilitários Supabase
│   ├── repositories/      # Camada de dados
│   └── ...
├── types/                 # Definições de tipos TypeScript
└── utils/                 # Funções utilitárias

e2e/                       # Testes End-to-End
├── setup.ts               # Configuração dos testes E2E
├── auth.e2e.test.ts       # Testes de autenticação
├── dashboard.e2e.test.ts  # Testes do dashboard
└── concursos.e2e.test.ts  # Testes de concursos
```

## 🎯 Features Principais

### ✅ Implementadas
- Sistema de autenticação completo
- Dashboard responsivo
- Gestão de concursos
- Sistema de apostilas
- Testes E2E abrangentes
- Configuração de desenvolvimento robusta

### 🚧 Em Desenvolvimento
- Sistema de simulados
- Flashcards interativos
- Relatórios de progresso
- Sistema de notificações

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor de desenvolvimento
npm run build              # Build de produção
npm run start              # Inicia servidor de produção

# Qualidade de Código
npm run lint               # Executa ESLint
npm run lint:fix           # Corrige problemas do ESLint
npm run type-check         # Verifica tipos TypeScript
npm run format             # Formata código com Prettier
npm run format:check       # Verifica formatação

# Testes
npm run test               # Testes unitários
npm run test:e2e           # Testes E2E (Vitest)
npm run test:playwright    # Testes E2E (Playwright)
npm run test:coverage      # Coverage dos testes

# Análise
npm run analyze            # Analisa bundle size
```

## 🌐 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Convenções

### Commits
Utilizamos Conventional Commits:
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` tarefas de manutenção

### Código
- Use TypeScript para type safety
- Siga as regras do ESLint e Prettier
- Escreva testes para novas funcionalidades
- Mantenha componentes pequenos e focados
- Use hooks customizados para lógica reutilizável

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de dependências peer**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Erro de tipos TypeScript**:
   ```bash
   npm run type-check
   ```

3. **Problemas com Supabase**:
   - Verifique as variáveis de ambiente
   - Confirme se o projeto Supabase está ativo
   - Verifique as permissões RLS

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através:
- Email: suporte@aprovafacil.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/aprovafacil-frontend/issues)

---

Desenvolvido com ❤️ para facilitar a aprovação em concursos públicos.



