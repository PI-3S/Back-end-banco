# Documentação - SGC SENAC Backend

Bem-vindo à documentação do backend do Sistema de Gestão de Certificados (SGC) SENAC.

## Índice

- [Estrutura do Projeto](./estrutura-projeto.md) - Visão geral da arquitetura e estrutura de diretórios
- [Configuração](./config.md) - Configurações do Firebase
- [Middlewares](./middlewares.md) - Autenticação e autorização
- [Rotas da API](#rotas-da-api)
- [Serviços](#serviços)
- [Scripts](./scripts.md) - Scripts utilitários

## Rotas da API

### Autenticação
- [auth.js](./routes-auth.md) - Login e recuperação de senha

### Gestão de Usuários
- [usuarios.js](./routes-usuarios.md) - CRUD de usuários

### Gestão de Cursos
- [cursos.js](./routes-cursos.md) - CRUD de cursos

### Regras de Atividades
- [regras.js](./routes-regras.md) - Regras de atividades complementares

### Submissões
- [submissoes.js](./routes-submissoes.md) - Submissões de alunos

### Certificados
- [certificados.js](./routes-certificados.md) - Upload de certificados

### Vínculos
- [coordenadores_cursos.js](./routes-coordenadores-cursos.md) - Vínculo coordenador-curso
- [alunos_cursos.js](./routes-alunos-cursos.md) - Vínculo aluno-curso

### Dashboard
- [dashboard.js](./routes-dashboard.md) - Métricas e dashboards

### Configurações
- [configuracoes.js](./routes-configuracoes.md) - Configurações do sistema

## Serviços

- [email.js](./services-email.md) - Envio de emails
- [logs.js](./services-logs.md) - Registro de logs
- [ocr.js](./services-ocr.md) - Extração de texto (OCR)

## Resumo de Endpoints

### Autenticação
- `POST /api/auth/login` - Realizar login
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha

### Usuários
- `POST /api/usuarios` - Criar usuário
- `GET /api/usuarios` - Listar usuários
- `PATCH /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Excluir usuário
- `POST /api/usuarios/:id/reset-senha` - Resetar senha

### Cursos
- `POST /api/cursos` - Criar curso
- `GET /api/cursos` - Listar cursos
- `PATCH /api/cursos/:id` - Atualizar curso
- `DELETE /api/cursos/:id` - Excluir curso

### Regras
- `POST /api/regras` - Criar regra
- `GET /api/regras` - Listar regras
- `PATCH /api/regras/:id` - Atualizar regra
- `DELETE /api/regras/:id` - Excluir regra

### Submissões
- `POST /api/submissoes` - Criar submissão
- `GET /api/submissoes` - Listar submissões
- `GET /api/submissoes/:id` - Buscar submissão
- `PATCH /api/submissoes/:id` - Avaliar submissão
- `DELETE /api/submissoes/:id` - Excluir submissão

### Certificados
- `POST /api/certificados` - Upload de certificado
- `GET /api/certificados` - Listar certificados

### Vínculos
- `POST /api/coordenadores-cursos` - Vincular coordenador a curso
- `GET /api/coordenadores-cursos` - Listar vínculos de coordenadores
- `DELETE /api/coordenadores-cursos/:id` - Remover vínculo de coordenador
- `POST /api/alunos-cursos` - Vincular aluno a curso
- `GET /api/alunos-cursos` - Listar vínculos de alunos
- `DELETE /api/alunos-cursos/:id` - Remover vínculo de aluno

### Dashboard
- `GET /api/dashboard/coordenador` - Métricas do coordenador
- `GET /api/dashboard/aluno` - Métricas do aluno

### Configurações
- `GET /api/configuracoes/:id` - Buscar configuração
- `POST /api/configuracoes/:id` - Salvar configuração
- `POST /api/configuracoes/test-email` - Enviar email de teste

## Permissões

### super_admin
- Acesso total ao sistema
- Pode criar/editar/excluir cursos e regras
- Pode gerenciar todos os usuários
- Vê dados de todos os cursos no dashboard

### coordenador
- Gerencia cursos vinculados
- Valida submissões de alunos
- Pode criar/editar/excluir alunos de seus cursos
- Vê apenas dados dos cursos que coordena

### aluno
- Envia submissões de atividades
- Visualiza seu próprio progresso
- Faz upload de certificados

## Como Executar

### Desenvolvimento
```bash
cd functions
npm install
npm run dev
```

### Produção (Firebase)
```bash
firebase deploy --only functions
```

### Produção (Vercel)
```bash
vercel deploy
```

## Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-client-email
FIREBASE_PRIVATE_KEY=sua-private-key
FIREBASE_STORAGE_BUCKET=seu-storage-bucket
FIREBASE_API_KEY=sua-api-key
EMAIL_USER=seu-email
EMAIL_PASS=sua-senha
FRONTEND_URL=https://seu-frontend.com
OCR_API_KEY=sua-ocr-api-key
```