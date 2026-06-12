# Arquitetura do Sistema — SGC SENAC

## 1. Visão Geral

O SGC SENAC é uma aplicação web com separação clara entre frontend e backend:

- **Backend**: API REST (Node.js + Express), implantada na Vercel e Firebase Functions
- **Frontend**: PWA/Web que consome a API via HTTP/JSON
- **Banco de dados**: Firebase (Auth + Firestore + Storage) — BaaS gerenciado

```
[Mobile / PWA / Web]
        │  HTTPS + JSON + Bearer Token
        ▼
[API REST — Express]  ←── Vercel / Firebase Functions
        │
        ├── Firebase Auth    (Autenticação JWT)
        ├── Firestore        (Banco NoSQL)
        └── Cloud Storage    (Arquivos e certificados)
```

---

## 2. Arquitetura em Camadas

O sistema segue uma arquitetura em camadas com responsabilidades bem definidas:

```
┌───────────────────────────────────────────────────┐
│                    CLIENTE                        │
│         (Browser / PWA / App Mobile)              │
└───────────────────────┬───────────────────────────┘
                        │ HTTP Request
                        ▼
┌───────────────────────────────────────────────────┐
│               CAMADA DE ROTAS                     │
│  routes/auth.js  routes/usuarios.js  ...          │
│  Responsabilidade: receber requisição, validar    │
│  payload, orquestrar resposta HTTP                │
└───────────────────────┬───────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────┐
│             CAMADA DE MIDDLEWARES                 │
│  middlewares/auth.js                              │
│  Responsabilidade: verificar token JWT,           │
│  aplicar controle de acesso por perfil (RBAC)     │
└───────────────────────┬───────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────┐
│             CAMADA DE SERVIÇOS                    │
│  services/email.js  services/ocr.js               │
│  services/logs.js                                 │
│  Responsabilidade: lógica reutilizável,           │
│  integrações com APIs externas                    │
└───────────────────────┬───────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────┐
│          CAMADA DE INFRAESTRUTURA                 │
│  Firebase Auth / Firestore / Cloud Storage        │
│  Responsabilidade: persistência, autenticação,    │
│  armazenamento de arquivos                        │
└───────────────────────────────────────────────────┘
```

### Por que essa separação?

| Camada | Benefício |
|--------|-----------|
| Rotas separadas por domínio | Cada módulo (cursos, usuarios, etc.) é independente e manutenível isoladamente |
| Middleware centralizado | Autenticação e autorização escritas uma vez, aplicadas em todos os módulos |
| Serviços reutilizáveis | Email, OCR e logs não ficam duplicados em cada rota |
| Firebase como infraestrutura | BaaS gerenciado elimina necessidade de servidor de banco de dados próprio |

---

## 3. Organização de Módulos

Cada domínio do negócio possui seu próprio arquivo de rotas:

```
routes/
├── auth.js               # Autenticação (público)
├── usuarios.js           # Gestão de usuários
├── cursos.js             # Gestão de cursos
├── regras.js             # Regras de atividades por curso
├── submissoes.js         # Ciclo de vida das atividades
├── certificados.js       # Upload e OCR de certificados
├── coordenadores_cursos.js  # Vínculo coordenador ↔ curso
├── alunos_cursos.js      # Vínculo aluno ↔ curso
├── dashboard.js          # Métricas agregadas
└── configuracoes.js      # Configurações do sistema
```

Cada arquivo de rota é responsável por:
1. Definir endpoints do seu domínio
2. Aplicar middlewares de autorização apropriados
3. Executar regras de negócio do domínio
4. Chamar serviços quando necessário

---

## 4. Padrões de Projeto Aplicados

### 4.1 Middleware Pattern (Chain of Responsibility)

Autenticação e autorização são implementadas como middlewares encadeados:

```
POST /api/usuarios
    │
    ├── verificarToken()      ← valida JWT com Firebase Auth
    ├── exigirPerfil(...)     ← verifica se perfil tem permissão
    └── handler()             ← lógica de negócio
```

O middleware `auth.js` exporta duas funções reutilizadas em todas as rotas:
- `verificarToken` — decodifica e valida o Bearer Token
- `exigirPerfil(...perfis)` — factory que retorna middleware de autorização por perfil

### 4.2 Service Layer Pattern

Lógica reutilizável encapsulada em serviços independentes das rotas:

| Serviço | Consumidores |
|---------|-------------|
| `email.js` | `usuarios.js`, `submissoes.js`, `auth.js`, `configuracoes.js` |
| `ocr.js` | `certificados.js` |
| `logs.js` | Todos os módulos de rotas |

Cada serviço tem responsabilidade única e pode ser testado, substituído ou evoluído sem impactar as rotas.

### 4.3 Singleton Pattern

`config/firebase.js` inicializa o Firebase Admin SDK uma única vez e exporta a instância:

```js
// Uma inicialização → reusada em todos os módulos
const admin = require('./config/firebase');
```

Evita múltiplas inicializações e garante uma única conexão com o Firebase.

### 4.4 Cascade Rollback Pattern (Transação Manual)

O cadastro de usuário executa operações em múltiplos sistemas com rollback em cascata:

```
1. Criar no Firebase Auth
        │ falha → fim
        ▼
2. Salvar no Firestore
        │ falha → [deletar do Auth] → fim
        ▼
3. Criar vínculo aluno-curso (se aplicável)
        │ falha → [deletar vínculo] → [deletar Firestore] → [deletar Auth]
        ▼
4. Sucesso
```

Garante consistência entre Firebase Auth e Firestore, que não possuem transações nativas cross-service.

### 4.5 Role-Based Access Control (RBAC)

Três perfis com permissões progressivas:

```
super_admin  ─── acesso total
     │
coordenador  ─── gerencia seu curso + alunos
     │
  aluno      ─── acesso aos próprios dados
```

Implementado via `exigirPerfil('super_admin', 'coordenador')` aplicado por rota.

### 4.6 Module Pattern

Cada domínio é um módulo JavaScript independente, seguindo o princípio de responsabilidade única:

```js
// index.js — composição de módulos
app.use('/api/cursos', require('./routes/cursos'));
app.use('/api/usuarios', require('./routes/usuarios'));
// ...
```

---

## 5. Modelagem de Dados (Firestore)

O Firestore é um banco NoSQL orientado a documentos. O modelo de dados reflete as entidades do negócio:

```
usuarios/          ← perfil: super_admin | coordenador | aluno
cursos/            ← carga_horaria_minima
regras_atividade/  ← limite_horas, área, curso_id
submissoes/        ← status: pendente | aprovado | reprovado | correcao
certificados/      ← url_arquivo, texto_extraido (OCR)
alunos_cursos/     ← relação N:M aluno ↔ curso
coordenadores_cursos/ ← relação N:M coordenador ↔ curso
logs/              ← auditoria de ações
configuracoes/     ← email_config, sistema_config (singletons)
```

Relações entre coleções usam referências por ID (campo `curso_id`, `aluno_id`, etc.), padrão do Firestore para relacionamentos.

---

## 6. Fluxo de Autenticação

```
1. Frontend envia  POST /api/auth/login  {email, senha}
2. Backend verifica credenciais no Firebase Auth
3. Backend gera token customizado
4. Frontend armazena token
5. Próximas requisições incluem  Authorization: Bearer <token>
6. Middleware verificarToken() valida token a cada requisição
7. req.usuario fica disponível com uid, perfil, email
```

---

## 7. Integração com Serviços Externos

| Serviço | Finalidade | Como é usado |
|---------|-----------|--------------|
| Firebase Auth | Autenticação de usuários | Token JWT verificado pelo Admin SDK |
| Firestore | Persistência de dados | Leitura/escrita via Admin SDK |
| Cloud Storage | Armazenamento de certificados | Upload via `@google-cloud/storage` |
| OCR.space API | Extração de texto de PDFs/imagens | HTTP POST com arquivo em base64 |
| SMTP (Nodemailer) | Notificações por email | Configurado dinamicamente via Firestore |

---

## 8. Decisões de Arquitetura

### Por que Express e não NestJS/Fastify?
Projeto acadêmico com escopo definido. Express oferece menor curva de aprendizado e suficiente para os requisitos.

### Por que Firebase ao invés de PostgreSQL/MySQL?
- Autenticação, banco e storage em um único serviço gerenciado
- Deploy serverless nativo (Firebase Functions)
- Sem necessidade de gerenciar infraestrutura de banco de dados

### Por que separar `functions/` da raiz?
Estrutura exigida pelo Firebase Functions: o código-fonte fica em `functions/` com seu próprio `package.json`, enquanto a raiz contém apenas configurações do Firebase e do repositório.

### Por que lógica nas rotas e não em controllers separados?
O projeto possui um nível de complexidade que não justifica uma camada de controllers. A estrutura atual (middleware → route handler → service) mantém a clareza sem overhead arquitetural desnecessário.
