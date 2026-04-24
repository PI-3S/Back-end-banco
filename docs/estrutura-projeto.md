# Estrutura do Projeto - SGC SENAC

## Visão Geral

Este é o backend do **Sistema de Gestão de Certificados (SGC) SENAC**, uma aplicação desenvolvida com Node.js, Express e Firebase para gerenciar atividades complementares, submissões de alunos, certificados e coordenação de cursos.

## Stack Tecnológico

- **Node.js** (v22) - Runtime JavaScript
- **Express** - Framework web para criação de APIs REST
- **Firebase** - Backend as a Service (Authentication, Firestore, Storage)
- **Nodemailer** - Envio de emails
- **Tesseract.js** - OCR para extração de texto de imagens/PDFs
- **Multer** - Upload de arquivos

## Arquitetura

O projeto segue uma arquitetura em camadas:

```
┌─────────────────────────────────────┐
│         Cliente (Frontend)          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         API Routes (Express)         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      Middlewares (Autenticação)     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Firebase Services            │
│  (Auth, Firestore, Storage)          │
└─────────────────────────────────────┘
```

## Estrutura de Diretórios

```
Back-end-banco/
├── docs/                          # Documentação do projeto
├── firebase.json                  # Configuração do Firebase
├── .firebaserc                    # Configuração de projetos Firebase
├── package.json                   # Dependências do projeto raiz
├── functions/                     # Código principal da aplicação
│   ├── config/                    # Configurações
│   │   └── firebase.js           # Inicialização do Firebase Admin
│   ├── controllers/               # Controladores (vazio, lógica nas rotas)
│   ├── middlewares/               # Middlewares de autenticação
│   │   └── auth.js               # Verificação de token e perfil
│   ├── routes/                    # Rotas da API
│   │   ├── auth.js               # Autenticação (login, forgot-password)
│   │   ├── usuarios.js           # CRUD de usuários
│   │   ├── cursos.js             # CRUD de cursos
│   │   ├── regras.js             # Regras de atividades complementares
│   │   ├── submissoes.js         # Submissões de alunos
│   │   ├── certificados.js       # Upload de certificados
│   │   ├── coordenadores_cursos.js # Vínculo coordenador-curso
│   │   ├── alunos_cursos.js      # Vínculo aluno-curso
│   │   ├── dashboard.js          # Métricas e dashboards
│   │   └── configuracoes.js      # Configurações do sistema
│   ├── services/                  # Serviços auxiliares
│   │   ├── email.js              # Envio de emails
│   │   ├── logs.js               # Registro de logs
│   │   └── ocr.js                # Extração de texto (OCR)
│   ├── scripts/                  # Scripts de setup
│   │   └── setup-firestore.js   # Setup inicial do Firestore
│   ├── index.js                  # Entry point da aplicação
│   ├── .env                      # Variáveis de ambiente
│   ├── package.json              # Dependências do functions
│   └── vercel.json               # Configuração de deploy na Vercel
└── node_modules/                 # Dependências instaladas
```

## Coleções do Firestore

O sistema utiliza as seguintes coleções no Firestore:

- **usuarios** - Dados dos usuários (alunos, coordenadores, super_admin)
- **cursos** - Cursos disponíveis no sistema
- **regras_atividade** - Regras para cada área de atividade complementar
- **submissoes** - Submissões de atividades complementares
- **atividades_complementares** - Detalhes das atividades complementares
- **certificados** - Arquivos de certificados enviados
- **coordenadores_cursos** - Vínculo entre coordenadores e cursos
- **alunos_cursos** - Vínculo entre alunos e cursos
- **configuracoes** - Configurações do sistema (email, sistema)
- **logs** - Registro de ações no sistema

## Perfis de Usuário

O sistema possui três perfis de usuário:

1. **super_admin** - Acesso total ao sistema
2. **coordenador** - Gerencia cursos e valida submissões
3. **aluno** - Envia submissões e visualiza seu progresso

## Fluxo Principal

1. **Login** - Usuário autentica via Firebase Auth
2. **Submissão** - Aluno envia atividade complementar
3. **Validação** - Coordenador aprova/reprova a submissão
4. **Certificação** - Sistema calcula horas e progresso do aluno
5. **Notificações** - Emails são enviados automaticamente