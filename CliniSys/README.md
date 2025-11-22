# CliniSys - Sistema de Gestão Clínica 🏥

Um sistema moderno e completo de gerenciamento de clínica desenvolvido com React, TypeScript e Supabase. Inclui agendamento de consultas, gestão de inventário, controle de profissionais e prontuário eletrônico.

## 🎯 Características Principais

- ✅ **Autenticação Segura**: Integração com Supabase Auth usando bcrypt
- ✅ **Painel Admin**: Dashboard com estatísticas e gerenciamento completo
- ✅ **Agendamento**: Sistema de consultas com médicos e pacientes
- ✅ **Gestão de Inventário**: Controle de medicamentos e materiais médicos
- ✅ **Gestão de Pessoal**: Registro de médicos e profissionais de saúde
- ✅ **Prontuário Eletrônico**: Histórico de consultas e registros médicos
- ✅ **Portal do Paciente**: Visualização de consultas e perfil pessoal
- ✅ **Controle de Acesso**: RBAC (Role-Based Access Control) com RLS no Supabase
- ✅ **Interface Responsiva**: Design moderno com Tailwind CSS e shadcn/ui
- ✨ **Animação Interativa**: Background animado com moléculas na página de login

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes reutilizáveis
- **React Query** - Gerenciamento de estado async
- **React Router** - Roteamento

### Backend & Banco de Dados
- **Supabase** - PostgreSQL + Auth + Real-time
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança no nível da linha

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta no [Supabase](https://supabase.com)
- Git

## 🚀 Quick Start

### 1. Clonar o repositório

```bash
git clone https://github.com/AngeLZinS2/vita-panel.git
cd vita-panel
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

> Obtém essas credenciais em Supabase > Project Settings > API

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:8082`

## 👥 Usuários de Teste

| Email | Senha | Papel |
|-------|-------|-------|
| admin@gmail.com | teste123 | Admin |
| patient@example.com | patient123 | Paciente |
| daviribeiro@gmail.com | teste123 | Médico |

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── admin/           # Componentes específicos do admin
│   ├── patient/         # Componentes específicos do paciente
│   ├── AnimatedDNABackground.tsx  # Background animado
│   └── ...
├── pages/
│   ├── Login.tsx        # Página de autenticação
│   ├── Register.tsx     # Página de registro
│   ├── admin/           # Páginas do painel admin
│   └── patient/         # Páginas do portal do paciente
├── contexts/
│   └── AuthContext.tsx  # Contexto de autenticação
├── integrations/
│   └── supabase/        # Cliente Supabase
└── App.tsx
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## 🗄️ Banco de Dados

### Tabelas principais:
- **profiles** - Dados dos usuários
- **user_roles** - Papéis dos usuários (admin, patient, professional)
- **appointments** - Agendamentos de consultas
- **medical_records** - Histórico médico
- **staff** - Informações de profissionais
- **inventory** - Estoque de medicamentos e materiais

Todas as tabelas possuem Row Level Security (RLS) para garantir que usuários só acessem seus próprios dados.

## 🔐 Segurança

- ✅ Autenticação via Supabase Auth
- ✅ Senhas criptografadas com bcrypt
- ✅ Row Level Security (RLS) ativo
- ✅ Validação de tipos com TypeScript
- ✅ Proteção de rotas com ProtectedRoute

## 📦 Build & Deploy

### Construir para produção

```bash
npm run build
```

### Deploy (exemplos)

**Vercel:**
```bash
vercel deploy --prod
```

**Netlify:**
```bash
netlify deploy --prod --dir=dist
```

**Docker:**
```bash
docker build -t clinisys .
docker run -p 3000:3000 clinisys
```

## 🐛 Troubleshooting

### Erro de conexão com Supabase
- Verifique se `.env` está configurado corretamente
- Confirme que a URL e chave do Supabase estão válidas

### Login não funciona
- Limpe o localStorage do navegador
- Verifique se o usuário existe em `auth.users`
- Veja console do navegador para erros específicos

### Dados não aparecem
- Confirme que RLS está desabilitado ou configurado para seu usuário
- Verifique permissões no Supabase SQL Editor

## 📞 Suporte

Para dúvidas ou problemas, abra uma [issue no GitHub](https://github.com/AngeLZinS2/vita-panel/issues).

## 📄 Licença

MIT

## 👨‍💻 Autor

**Angel Neri** - [@AngeLZinS2](https://github.com/AngeLZinS2)

---

**Desenvolvido com ❤️ para melhorar a gestão de clínicas**
