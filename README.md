# 🛡️ IAM Platform - Identity and Access Management

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)](https://github.com)

## 📋 Índice

- [O que é IAM?](#-o-que-é-iam)
- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Setup](#-instalação-e-setup)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Endpoints da API](#-endpoints-da-api)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Contribuição](#-contribuição)

## 🔍 O que é IAM?

**Identity and Access Management (IAM)** é um sistema de segurança que gerencia identidades digitais e controla o acesso a recursos. Este projeto é uma implementação completa de uma plataforma IAM inspirada no modelo AWS IAM, oferecendo:

### 🎯 Funcionalidades Principais

- **Gestão de Identidades**: Criação e gerenciamento de usuários, grupos e contas
- **Controle de Acesso**: Sistema granular de permissões baseado em políticas
- **Autenticação Segura**: JWT com refresh tokens e rate limiting
- **Autorização Flexível**: Políticas customizáveis com controle fino de recursos
- **Sessões de Roles**: Assumir diferentes papéis com permissões específicas
- **Auditoria**: Rastreamento completo de ações e acessos

### 🏢 Casos de Uso

- **Empresas**: Controle de acesso a sistemas internos
- **Aplicações Web**: Autenticação e autorização de usuários
- **APIs**: Controle granular de acesso a endpoints
- **Microserviços**: Gestão centralizada de identidades
- **SaaS**: Isolamento multi-tenant com segurança

## ✨ Características

### 🔐 Segurança Avançada

- ✅ **Autenticação JWT** com tokens de acesso e refresh
- ✅ **Rate Limiting** para prevenir ataques de força bruta
- ✅ **Blacklist de Tokens** híbrida (Redis + PostgreSQL)
- ✅ **Bcrypt** para hash seguro de senhas
- ✅ **Headers de Segurança** com Helmet.js
- ✅ **CORS** configurável por ambiente
- ✅ **Validação de Entrada** com Joi

### 🎛️ Sistema de Permissões Granular

- ✅ **Políticas Baseadas em Recursos** (ex: `account/123`, `user/456`)
- ✅ **Permissões por Serviço** (ex: `iam:CreateUser`, `s3:GetObject`)
- ✅ **Herança de Permissões** via grupos e roles
- ✅ **Controle de Contexto** com condições dinâmicas
- ✅ **Políticas de Sistema** pré-definidas

### 🏗️ Arquitetura Robusta

- ✅ **PostgreSQL** como banco de dados principal
- ✅ **Redis** para cache e blacklist de tokens
- ✅ **Padrão Repository** para abstração de dados
- ✅ **Middleware de Autorização** reutilizável
- ✅ **Tratamento de Erros** centralizado

### 📚 Documentação Completa

- ✅ **Swagger/OpenAPI** para documentação da API
- ✅ **Exemplos de Uso** em scripts demonstrativos
- ✅ **Guias de Setup** para diferentes ambientes
- ✅ **Testes Abrangentes** com Jest

## 🏛️ Arquitetura

```
📦 iam-platform-js/
├── 🚀 account-service/          # Serviço principal IAM
│   ├── 📁 src/
│   │   ├── 🎮 controllers/      # Controladores da API
│   │   ├── 🔧 services/         # Lógica de negócio
│   │   ├── 💾 repositories/     # Camada de dados
│   │   ├── 🗂️ models/          # Modelos de dados
│   │   ├── 🛣️ routes/          # Definição de rotas
│   │   ├── 🛡️ middleware/      # Middlewares (auth, cors, etc)
│   │   └── ⚙️ config/          # Configurações
│   ├── 🧪 tests/               # Testes automatizados
│   ├── 📜 scripts/             # Scripts utilitários
│   ├── 🗄️ migrations/         # Migrações do banco
│   └── 📖 docs/               # Documentação
└── 📋 README.md               # Este arquivo
```

### 🔗 Fluxo de Dados

**Camadas da Aplicação:**
1. **Cliente** → Faz requisições HTTP
2. **Express Router** → Roteamento de endpoints
3. **Auth Middleware** → Validação de autenticação
4. **Authorization Middleware** → Verificação de permissões
5. **Controller** → Lógica de controle da API
6. **Service** → Regras de negócio
7. **Repository** → Abstração de dados
8. **PostgreSQL** → Banco de dados principal
9. **Redis** → Cache e blacklist de tokens

## 📋 Pré-requisitos

### 🖥️ Sistema

- **Node.js** 18+ 
- **PostgreSQL** 15+
- **Redis** 6+ (opcional, para cache)
- **Git** para controle de versão

### 📦 Dependências Principais

- **bcrypt** - Hash seguro de senhas
- **express** - Framework web Node.js
- **jsonwebtoken** - Autenticação JWT
- **pg** - Cliente PostgreSQL
- **redis** - Cliente Redis (opcional)
- **joi** - Validação de esquemas
- **helmet** - Headers de segurança
- **cors** - Cross-Origin Resource Sharing
- **express-rate-limit** - Limitação de taxa
- **swagger-ui-express** - Documentação da API

## 🚀 Instalação e Setup

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd iam-platform-js/account-service
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Banco de Dados

#### PostgreSQL

```bash
# Crie o banco de dados
createdb iam_platform
createdb iam_platform_test  # Para testes
```

#### Redis (Opcional)

```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Inicie o Redis
redis-server
```

### 4. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite as configurações
nano .env
```

### 5. Execute as Migrações

```bash
npm run db:migrate
```

### 6. Inicialize as Roles de Sistema

```bash
# Criar roles e políticas de sistema (root, iam-user)
node scripts/init-system-roles.js

# Atribuir role root a usuários root existentes (se houver)
node scripts/assign-root-roles.js
```

### 7. Inicie o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## ⚙️ Configuração

### 📄 Arquivo .env

```bash
# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/iam_platform
# Ou configure individualmente:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=iam_platform
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Redis (Opcional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos
RATE_LIMIT_MAX_REQUESTS=1000   # Máximo de requests
AUTH_RATE_LIMIT_MAX=5          # Login attempts
REFRESH_RATE_LIMIT_MAX=10      # Refresh attempts
```

### 🗄️ Configuração do Banco

O sistema suporta duas formas de configuração:

#### Opção 1: DATABASE_URL (Recomendado)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

#### Opção 2: Parâmetros Individuais
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=iam_platform
DATABASE_USER=postgres
DATABASE_PASSWORD=password
```

## 🎯 Configuração Inicial - Roles e Usuários

### 👑 Sistema de Roles

O IAM Platform possui dois tipos principais de usuários:

#### 🔴 **Usuários Root** (Super Administradores)
- **Role**: `root`
- **Permissões**: Acesso completo a todos os recursos
- **Uso**: Administração de sistema, criação de contas
- **Identificação**: Campo `isRoot: true` no banco

#### 🔵 **Usuários IAM** (Usuários Regulares)
- **Role**: `iam-user`
- **Permissões**: Baseadas em políticas específicas
- **Uso**: Uso normal da aplicação
- **Identificação**: Campo `isRoot: false` no banco

### 🚀 Setup Inicial Passo-a-Passo

#### 1. Criar a Primeira Conta Root
- **Endpoint**: `POST /api/v1/accounts`
- **Dados**: nome, email, senha, `isRoot: true`
- **Resultado**: Conta root criada automaticamente

#### 2. Inicializar Roles de Sistema
```bash
node scripts/init-system-roles.js
```
- Cria roles: `root` e `iam-user`
- Cria políticas padrão do sistema

#### 3. Atribuir Role Root (se necessário)
```bash
node scripts/assign-root-roles.js
```
- Aplica role `root` a usuários existentes com `isRoot: true`

#### 4. Verificar Setup
- **Login**: `POST /api/v1/auth/login`
- **Verificar roles**: `GET /api/v1/users/roles`
- **Resultado esperado**: Role `root` com acesso administrativo completo

### 📋 Scripts Disponíveis para Configuração

```bash
# Scripts de configuração inicial
npm run db:migrate              # Executar migrações
node scripts/init-system-roles.js    # Criar roles de sistema
node scripts/assign-root-roles.js    # Atribuir roles a usuários existentes

# Scripts de manutenção
npm run db:clean               # Limpar dados mantendo sistema
npm run db:clean-force         # Limpar sem confirmação
npm run db:reset               # Reset completo do banco
```

### 🎭 Diferenças entre Root e IAM Users

| Aspecto | Root User | IAM User |
|---------|-----------|----------|
| **Criação de Contas** | ✅ Permitido | ❌ Não permitido |
| **Gestão de Usuários** | ✅ Todos os usuários | 🔒 Apenas da própria conta |
| **Políticas de Sistema** | ✅ Pode gerenciar | ❌ Apenas visualizar |
| **Roles de Sistema** | ✅ Pode atribuir | ❌ Não permitido |
| **Acesso Global** | ✅ Todos os recursos | 🔒 Recursos da conta |
| **Assumir Roles** | ✅ Qualquer role | 🔒 Roles permitidas |

### 🏢 Fluxo de Uso Típico

1. **Criar Conta da Empresa**
   - Endpoint: `POST /api/v1/accounts`
   - Dados: nome, email, senha (usuário root é criado automaticamente)

2. **Login do Administrador**
   - Endpoint: `POST /api/v1/auth/login`
   - Retorna: tokens de acesso e refresh

3. **Criar Estrutura Organizacional**
   - Criar grupos para diferentes equipes
   - Definir políticas de acesso específicas
   - Criar usuários IAM para a equipe

4. **Atribuir Permissões**
   - Adicionar usuários aos grupos apropriados
   - Anexar políticas aos grupos ou usuários
   - Configurar roles para diferentes responsabilidades

5. **Uso Operacional**
   - Usuários fazem login e recebem tokens
   - Sistema verifica permissões em cada requisição
   - Administradores podem assumir roles conforme necessário

## 🎯 Uso

### 🚀 Iniciando o Sistema

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start

# Com Docker
docker-compose up -d
```

### 🔍 Verificação de Saúde

```bash
curl http://localhost:3001/health
```

### 📖 Documentação da API

Acesse: `http://localhost:3001/api-docs`

## 📡 Endpoints da API - Referência Completa

### 🔐 Autenticação - `/api/v1/auth`

| Método | Endpoint | Descrição | Auth | Rate Limit | Body/Params |
|--------|----------|-----------|------|------------|-------------|
| `POST` | `/login` | 🔑 Login com email/senha | ❌ | 5/15min | `{email, password}` |
| `POST` | `/login-iam` | 🔑 Login IAM (username/account) | ❌ | 5/15min | `{username, accountId, password}` |
| `POST` | `/refresh` | 🔄 Renovar token de acesso | 🔓 | 10/15min | `{refreshToken}` |
| `POST` | `/logout` | 🚪 Logout e invalidar token | ✅ | - | - |
| `POST` | `/validate` | ✅ Validar token | ✅ | - | - |

### 🏢 Contas - `/api/v1/accounts`

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `POST` | `/` | ➕ Criar conta | ❌ **Público** | `{name, email, password}` |
| `GET` | `/` | 📋 Listar contas | `iam:ListAccounts` | - |
| `GET` | `/:id` | 🔍 Obter conta por ID | `iam:GetAccount` | `id` |
| `PUT` | `/:id` | ✏️ Atualizar conta | `iam:UpdateAccount` | `id, {name, email, ...}` |
| `DELETE` | `/:id` | 🗑️ Deletar conta | `iam:DeleteAccount` | `id` |
| `GET` | `/:accountId/users` | 👥 Usuários da conta | `iam:ListUsers` | `accountId` |

### 👥 Usuários - `/api/v1/users`

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/` | 📋 Usuários do token atual | `iam:ListUsers` | - |
| `GET` | `/roles` | 👑 Roles do usuário atual | ✅ **Próprio usuário** | - |
| `POST` | `/` | ➕ Criar usuário | `iam:CreateUser` | `{username, email, password, isRoot}` |
| `GET` | `/:id` | 🔍 Obter usuário | `iam:GetUser` | `id` |
| `PUT` | `/:id` | ✏️ Atualizar usuário | `iam:UpdateUser` | `id, {username, email, ...}` |
| `PUT` | `/:id/password` | 🔐 Alterar senha | `iam:UpdateUserPassword` | `id, {newPassword, currentPassword}` |
| `DELETE` | `/:id` | 🗑️ Deletar usuário | `iam:DeleteUser` | `id` |

### 👑 Roles - `/api/v1/roles`

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/` | 📋 Listar roles | `iam:ListRoles` | - |
| `POST` | `/` | ➕ Criar role | `iam:CreateRole` | `{name, description, assumeRolePolicy}` |
| `GET` | `/:roleId` | 🔍 Obter role | `iam:GetRole` | `roleId` |
| `PUT` | `/:roleId` | ✏️ Atualizar role | `iam:UpdateRole` | `roleId, {name, description, ...}` |
| `DELETE` | `/:roleId` | 🗑️ Deletar role | `iam:DeleteRole` | `roleId` |
| `POST` | `/:roleId/attach-policy` | 📎 Anexar política | `iam:AttachRolePolicy` | `roleId, {policyId}` |
| `DELETE` | `/:roleId/detach-policy/:policyId` | 📎❌ Desanexar política | `iam:DetachRolePolicy` | `roleId, policyId` |
| `GET` | `/:roleId/policies` | 📜 Políticas do role | `iam:ListRolePolicies` | `roleId` |
| `POST` | `/:roleId/assume` | 🎭 Assumir role | `sts:AssumeRole` | `roleId, {sessionName?, durationSeconds?}` |
| `GET` | `/:roleId/sessions` | 📊 Sessões ativas | `iam:GetRole` | `roleId` |
| `DELETE` | `/sessions/:sessionId` | ❌ Revogar sessão | `sts:RevokeSession` | `sessionId` |
| `POST` | `/validate-trust-policy` | ✅ Validar política de confiança | `iam:ValidateAssumeRolePolicy` | `{trustPolicy}` |

### 📜 Políticas - `/api/v1/policies`

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/` | 📋 Listar políticas | `iam:ListPolicies` | - |
| `GET` | `/default` | 🏠 Políticas padrão do sistema | `iam:ListPolicies` | - |
| `POST` | `/` | ➕ Criar política | `iam:CreatePolicy` | `{name, description, policyDocument}` |
| `GET` | `/:policyId` | 🔍 Obter política | `iam:GetPolicy` | `policyId` |
| `PUT` | `/:policyId` | ✏️ Atualizar política | `iam:UpdatePolicy` | `policyId, {name, description, policyDocument}` |
| `DELETE` | `/:policyId` | 🗑️ Deletar política | `iam:DeletePolicy` | `policyId` |
| `POST` | `/:policyId/attach-user` | 👤📎 Anexar a usuário | `iam:AttachUserPolicy` | `policyId, {userId}` |
| `POST` | `/:policyId/attach-group` | 👥📎 Anexar a grupo | `iam:AttachGroupPolicy` | `policyId, {groupId}` |
| `DELETE` | `/:policyId/detach-user/:userId` | 👤📎❌ Desanexar de usuário | `iam:DetachUserPolicy` | `policyId, userId` |
| `DELETE` | `/:policyId/detach-group/:groupId` | 👥📎❌ Desanexar de grupo | `iam:DetachGroupPolicy` | `policyId, groupId` |
| `GET` | `/users/:userId/policies` | 👤📜 Políticas do usuário | `iam:ListUserPolicies` | `userId` |
| `GET` | `/groups/:groupId/policies` | 👥📜 Políticas do grupo | `iam:ListGroupPolicies` | `groupId` |
| `POST` | `/validate` | ✅ Validar documento de política | `iam:ValidatePolicy` | `{policyDocument}` |

### 👥 Grupos - `/api/v1/groups`

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/` | 📋 Listar grupos | `iam:ListGroups` | - |
| `POST` | `/` | ➕ Criar grupo | `iam:CreateGroup` | `{name, description}` |
| `GET` | `/:groupId` | 🔍 Obter grupo | `iam:GetGroup` | `groupId` |
| `PUT` | `/:groupId` | ✏️ Atualizar grupo | `iam:UpdateGroup` | `groupId, {name, description}` |
| `DELETE` | `/:groupId` | 🗑️ Deletar grupo | `iam:DeleteGroup` | `groupId` |
| `POST` | `/:groupId/users` | ➕👤 Adicionar usuário | `iam:AddUserToGroup` | `groupId, {userId}` |
| `DELETE` | `/:groupId/users/:userId` | ➖👤 Remover usuário | `iam:RemoveUserFromGroup` | `groupId, userId` |
| `GET` | `/:groupId/users` | 👥 Usuários do grupo | `iam:GetGroup` | `groupId` |
| `GET` | `/users/:userId/groups` | 👤👥 Grupos do usuário | `iam:GetUser` | `userId` |

### ⚡ Permissões - `/api/v1/permissions`

#### 🔧 Gerenciamento de Permissões

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/` | 📋 Listar permissões | `iam:ListPermissions` | - |
| `GET` | `/services` | 🏢 Agrupar por serviço | `iam:ListPermissions` | - |
| `POST` | `/` | ➕ Criar permissão | `iam:CreatePermission` | `{service, action, resource?, description}` |
| `GET` | `/:id` | 🔍 Obter permissão | `iam:GetPermission` | `id` |
| `PUT` | `/:id` | ✏️ Atualizar permissão | `iam:UpdatePermission` | `id, {service, action, resource, description}` |
| `DELETE` | `/:id` | 🗑️ Deletar permissão | `iam:DeletePermission` | `id` |
| `POST` | `/:id/attach-policy` | 📎 Anexar à política | `iam:AttachPermissionPolicy` | `id, {policyId}` |
| `DELETE` | `/:id/detach-policy/:policyId` | 📎❌ Desanexar da política | `iam:DetachPermissionPolicy` | `id, policyId` |

#### 🎯 Atribuição de Permissões

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `POST` | `/users/:userId/policies/:policyId` | 👤📎 Atribuir política a usuário | `iam:UserManagement` | `userId, policyId` |
| `DELETE` | `/users/:userId/policies/:policyId` | 👤📎❌ Remover política de usuário | `iam:UserManagement` | `userId, policyId` |
| `POST` | `/users/:userId/roles/:roleId` | 👤👑 Atribuir role a usuário | `iam:UserManagement` | `userId, roleId` |
| `DELETE` | `/users/:userId/roles/:roleId` | 👤👑❌ Remover role de usuário | `iam:UserManagement` | `userId, roleId` |

#### 🔍 Consulta de Permissões

| Método | Endpoint | Descrição | Permissão Requerida | Body/Params |
|--------|----------|-----------|---------------------|-------------|
| `GET` | `/policies/:policyId/permissions` | 📜⚡ Permissões da política | `iam:GetPolicy` | `policyId` |
| `GET` | `/roles/:roleId/permissions` | 👑⚡ Permissões do role | `iam:GetRole` | `roleId` |
| `GET` | `/users/:userId/permissions` | 👤⚡ Permissões efetivas do usuário | `iam:GetUser` | `userId` |

### 🔍 Endpoints de Sistema

| Método | Endpoint | Descrição | Auth | Resposta |
|--------|----------|-----------|------|----------|
| `GET` | `/health` | 💚 Health check | ❌ | `{status, timestamp, uptime}` |
| `GET` | `/api-docs` | 📖 Documentação Swagger | ❌ | Interface Swagger UI |

### 📊 Códigos de Status HTTP

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| `200` | ✅ Sucesso | Operação realizada com sucesso |
| `201` | ✅ Criado | Recurso criado com sucesso |
| `204` | ✅ Sem Conteúdo | Operação realizada, sem retorno |
| `400` | ❌ Requisição Inválida | Dados inválidos ou malformados |
| `401` | 🔐 Não Autorizado | Token inválido, expirado ou ausente |
| `403` | 🚫 Proibido | Sem permissão para acessar o recurso |
| `404` | 🔍 Não Encontrado | Recurso não existe |
| `409` | ⚠️ Conflito | Recurso já existe ou conflito de estado |
| `429` | 🚦 Rate Limit | Muitas tentativas, tente novamente |
| `500` | 💥 Erro Interno | Erro no servidor |

### 🎯 Recursos Especiais

- **🔓 Rate Limiting**: Endpoints de autenticação têm limite de tentativas
- **🎭 Role Assumption**: Gera novos tokens com permissões específicas
- **📊 Consultas Dinâmicas**: Permissões baseadas em contexto
- **✅ Validação**: Endpoints para validar políticas e documentos
- **🔍 Filtros**: Parâmetros de query para filtrar resultados

## 🔐 Autenticação e Autorização

### 🎫 Sistema de Tokens JWT

O sistema utiliza dois tipos de tokens:

1. **Access Token** (15 minutos): Para acesso às APIs
2. **Refresh Token** (7 dias): Para renovar access tokens

**Cabeçalho de autorização:**
```
Authorization: Bearer <access_token>
```

### 🛡️ Middleware de Autorização

O sistema possui middleware de autorização que verifica permissões baseadas em:
- **Serviço**: (ex: `iam`, `s3`, `sts`)
- **Ação**: (ex: `ListUsers`, `GetObject`)
- **Recurso**: (ex: `user/*`, `bucket/file.txt`)

**Permissões dinâmicas** são suportadas baseadas em parâmetros da requisição.

### 🎭 Sistema de Roles

```bash
# Assumir uma role (gera novo token com permissões da role)
curl -X POST http://localhost:3001/api/v1/roles/123/assume \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "AdminSession",
    "durationSeconds": 3600
  }'
```

## 💡 Exemplos de Uso

### 🏢 Criando uma Estrutura Organizacional

```bash
# 1. Criar conta da empresa
curl -X POST http://localhost:3001/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechCorp",
    "email": "admin@techcorp.com",
    "password": "AdminPass123!"
  }'

# 2. Fazer login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techcorp.com",
    "password": "AdminPass123!"
  }'

# 3. Criar grupo de desenvolvedores
curl -X POST http://localhost:3001/api/v1/groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Developers",
    "description": "Equipe de desenvolvimento"
  }'

## 💡 Exemplos de Uso

### 🏢 Criando uma Estrutura Organizacional

1. **Criar conta da empresa** - `POST /api/v1/accounts`
2. **Fazer login** - `POST /api/v1/auth/login`
3. **Criar grupo de desenvolvedores** - `POST /api/v1/groups`
4. **Criar política para desenvolvedores** - `POST /api/v1/policies`
5. **Adicionar usuários ao grupo** - `POST /api/v1/groups/:id/users`

### 🔍 Verificando Permissões

- **Verificar permissão específica** - `GET /api/v1/permissions/check`
- **Listar permissões de usuário** - `GET /api/v1/permissions/user/:id`
- **Consultar políticas efetivas** - `GET /api/v1/policies/users/:id/policies`

## 📝 Scripts Disponíveis

### 🔧 Desenvolvimento

```bash
npm run dev          # Iniciar com hot reload
npm run start        # Iniciar em produção
npm run test         # Executar todos os testes
npm run test:watch   # Testes em modo watch
npm run test:coverage # Testes com cobertura
```

### 🗄️ Banco de Dados

```bash
npm run db:migrate   # Executar migrações
npm run db:status    # Status das migrações
npm run db:reset     # Reset completo do banco
npm run db:setup     # Setup inicial (migrações)
npm run db:clean     # Limpar dados mantendo sistema
npm run db:clean-force # Limpar sem confirmação
```

## 🚀 Deploy

### 🐳 Docker

```bash
# Build da imagem
docker build -t iam-platform .

# Executar com Docker Compose
docker-compose up -d
```

### ☁️ Variáveis de Ambiente para Produção

```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=<strong-secret-key>
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
CORS_ORIGIN=https://yourdomain.com
```

### 🔒 Checklist de Segurança

- [ ] JWT_SECRET forte e único
- [ ] DATABASE_URL com credenciais seguras
- [ ] CORS_ORIGIN configurado para domínios específicos
- [ ] Rate limiting apropriado
- [ ] HTTPS habilitado
- [ ] Logs de auditoria ativados
- [ ] Backup automático do banco
- [ ] Monitoramento de saúde

## 🛠️ Resolução de Problemas

### ❌ Problemas Comuns

#### Erro de Conexão com Banco
- **Verificar PostgreSQL**: `pg_isready -h localhost -p 5432`
- **Testar conexão**: `psql -h localhost -U postgres -d iam_platform`
- **Conferir variáveis**: `DATABASE_URL` ou `DATABASE_HOST`

#### Token Inválido
- **Verificar JWT_SECRET**: Deve estar configurado no `.env`
- **Validar token**: `POST /api/v1/auth/validate`
- **Renovar token**: `POST /api/v1/auth/refresh`

#### Permissões Negadas
- **Verificar permissões**: `GET /api/v1/permissions/user/:id`
- **Conferir roles**: `GET /api/v1/users/roles`
- **Validar políticas**: `POST /api/v1/policies/validate`

### 📋 Logs e Debugging

- **Logs detalhados**: Configurar `DEBUG=*` no ambiente
- **Logs do IAM**: Configurar `DEBUG=iam:*` para logs específicos
- **Logs do servidor**: Verificar saída do console durante desenvolvimento
- **Logs de banco**: Habilitar logging no PostgreSQL se necessário

## 🤝 Contribuição

### 🌟 Como Contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### 📏 Padrões de Código

- **ESLint** para linting
- **Jest** para testes
- **Conventional Commits** para mensagens
- **JSDoc** para documentação
