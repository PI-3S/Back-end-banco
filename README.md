# SGC SENAC — Sistema de Gestão de Certificados

Backend da aplicação de gestão de atividades complementares curriculares do SENAC. API RESTful que gerencia o ciclo completo: submissão de atividades por alunos → avaliação por coordenadores → cálculo de carga horária.

## Visão Geral do Sistema

```text
┌──────────────┐     HTTPS/JSON      ┌──────────────────────────────┐
│  Frontend    │ ─────────────────►  │  API REST (Express/Node.js)  │
│  (PWA/Web)   │ ◄─────────────────  │  Vercel / Firebase Functions │
└──────────────┘                     └──────────────┬───────────────┘
                                                     │
                              ┌──────────────────────┼──────────────────────┐
                              ▼                      ▼                      ▼
                    ┌──────────────────┐  ┌────────────────┐  ┌────────────────────┐
                    │  Firebase Auth   │  │   Firestore    │  │ Firebase Storage   │
                    │  (Autenticação)  │  │  (Banco NoSQL) │  │  (Arquivos/Certs.) │
                    └──────────────────┘  └────────────────┘  └────────────────────┘
```

## Stack Tecnológico

| Camada | Tecnologia | Versão |
| ------ | ---------- | ------ |
| Runtime | Node.js | 22 |
| Framework | Express | 5.2.1 |
| Banco de dados | Firestore (Firebase) | Admin SDK 13.7.0 |
| Autenticação | Firebase Auth | Admin SDK 13.7.0 |
| Storage | Google Cloud Storage | 7.19.0 |
| Email | Nodemailer | 8.0.4 |
| Upload | Multer | 2.1.1 |
| OCR | OCR.space API | — |
| Deploy | Vercel + Firebase Functions | — |

## Arquitetura em Camadas

```text
Requisição HTTP
      │
      ▼
 [ Routes ]        ← Entrada, validação de payload, orquestração
      │
      ▼
 [ Middlewares ]   ← Autenticação JWT + controle de perfil (RBAC)
      │
      ▼
 [ Services ]      ← Lógica reutilizável (email, OCR, logs)
      │
      ▼
 [ Firebase ]      ← Auth, Firestore, Storage
```

Detalhes: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)

## Perfis e Permissões

| Perfil | Capacidades |
| ------ | ----------- |
| `super_admin` | Gerencia cursos, regras, todos os usuários e configurações |
| `coordenador` | Gerencia alunos do seu curso, avalia submissões |
| `aluno` | Envia atividades complementares, acompanha progresso |

## Endpoints Principais

| Módulo | Base URL | Descrição |
| ------ | -------- | --------- |
| Autenticação | `/api/auth` | Login, recuperação de senha |
| Usuários | `/api/usuarios` | CRUD com rollback em cascata |
| Cursos | `/api/cursos` | Gestão de cursos |
| Regras | `/api/regras` | Regras de atividades por curso |
| Submissões | `/api/submissoes` | Ciclo de vida das atividades |
| Certificados | `/api/certificados` | Upload + OCR automático |
| Dashboard | `/api/dashboard` | Métricas por perfil |
| Configurações | `/api/configuracoes` | Config SMTP e sistema |

Referência completa: [docs/DOCUMENTACAO-TECNICA-BACKEND.md](docs/DOCUMENTACAO-TECNICA-BACKEND.md)

## Como Executar

### Pré-requisitos

- Node.js 22+
- Conta Firebase com Firestore, Auth e Storage habilitados
- Chave de serviço do Firebase (service account)

### Desenvolvimento

```bash
cd functions
npm install
cp .env.example .env   # preencher variáveis
npm run dev            # nodemon, hot reload na porta 3000
```

### Produção

```bash
# Vercel
vercel deploy

# Firebase Functions
firebase deploy --only functions
```

### Variáveis de Ambiente

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
FIREBASE_API_KEY=
EMAIL_USER=
EMAIL_PASS=
OCR_API_KEY=
FRONTEND_URL=
```

## Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Arquitetura, camadas, padrões de projeto, decisões técnicas |
| [docs/DOCUMENTACAO-TECNICA-BACKEND.md](docs/DOCUMENTACAO-TECNICA-BACKEND.md) | Referência completa de endpoints, regras de negócio, coleções Firestore |
| [docs/REUSO-QUALIDADE.md](docs/REUSO-QUALIDADE.md) | Reuso de componentes, qualidade do código, gestão de configuração |
| [docs/api-exemplos-frontend.md](docs/api-exemplos-frontend.md) | Guia de integração para o frontend |

## Estrutura do Repositório

```text
Back-end-banco/
├── README.md                  # Este arquivo
├── docs/                      # Documentação
├── firebase.json              # Configuração Firebase
├── .firebaserc                # Projeto Firebase
└── functions/                 # Código da aplicação
    ├── index.js               # Entry point, montagem de rotas
    ├── config/
    │   └── firebase.js        # Inicialização Firebase Admin (singleton)
    ├── middlewares/
    │   └── auth.js            # Autenticação JWT + RBAC
    ├── routes/                # 10 módulos de domínio
    ├── services/              # Serviços reutilizáveis
    │   ├── email.js           # Notificações por email
    │   ├── logs.js            # Auditoria de ações
    │   └── ocr.js             # Extração de texto
    └── scripts/
        └── setup-firestore.js # Setup inicial do banco
```
