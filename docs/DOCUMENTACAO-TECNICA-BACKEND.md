# Documentação Técnica - Backend SGC SENAC

## 1. Visão Geral da API

API RESTful do Sistema de Gestão de Certificados (SGC) do SENAC, responsável pelo gerenciamento de atividades complementares curriculares. O sistema permite que alunos submetam atividades para validação de horas complementares, coordenadores avaliem as submissões, e superadministradores gerenciem cursos, regras e usuários.

**Base URL:** `http://localhost:3000`

---

## 2. Stack Tecnológica com Versões

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Node.js | 22 | Runtime |
| Express | 5.2.1 | Framework web |
| Firebase Admin SDK | 13.7.0 | Autenticação e Firestore |
| Firebase Functions | 7.2.2 | Deploy em cloud |
| @google-cloud/storage | 7.19.0 | Upload de arquivos |
| nodemailer | 8.0.4 | Envio de emails |
| multer | 2.1.1 | Upload de arquivos |
| form-data | 4.0.5 | Envio de dados multipart para OCR |
| node-fetch | 2.7.0 | Requisições HTTP |
| cors | 2.8.6 | Cross-origin |
| dotenv | 17.3.1 | Variáveis de ambiente |
| tesseract.js | 7.0.0 | OCR (importado mas não utilizado) |

---

## 3. Estrutura de Pastas

```
functions/
├── config/
│   └── firebase.js          # Configuração do Firebase Admin SDK
├── index.js                 # Entry point - montagem das rotas
├── middlewares/
│   └── auth.js              # Middlewares de autenticação e autorização
├── routes/
│   ├── auth.js              # Login e recuperação de senha
│   ├── usuarios.js          # CRUD de usuários
│   ├── cursos.js            # CRUD de cursos
│   ├── regras.js             # CRUD de regras de atividade
│   ├── submissoes.js        # CRUD de submissões de atividades
│   ├── certificados.js      # Upload de certificados com OCR
│   ├── coordenadores_cursos.js  # Vínculos coordenador-curso
│   ├── alunos_cursos.js     # Vínculos aluno-curso
│   ├── dashboard.js         # Métricas para coordenadores e alunos
│   └── configuracoes.js    # Configurações gerais do sistema
├── services/
│   ├── email.js             # Serviço de envio de emails
│   ├── logs.js              # Serviço de registro de logs
│   └── ocr.js               # Serviço de OCR (OCR.space API)
└── scripts/
    └── setup-firestore.js   # Script de configuração inicial do Firestore
```

---

## 4. Tabela Completa de Endpoints

### 4.1 Autenticação (`/api/auth`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/login` | Público | Login com email/senha. Retorna token JWT e dados do usuário |
| POST | `/forgot-password` | Público | Envia link de recuperação de senha por email |

### 4.2 Usuários (`/api/usuarios`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | super_admin, coordenador | Cria usuário (com rollback em cascata) |
| GET | `/` | super_admin, coordenador | Lista usuários (coordenador vê apenas seus alunos) |
| PATCH | `/:id` | super_admin, coordenador | Atualiza dados do usuário |
| DELETE | `/:id` | super_admin, coordenador | Remove usuário (com proteções) |
| POST | `/:id/reset-senha` | super_admin | Reseta senha de usuário |

### 4.3 Cursos (`/api/cursos`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | super_admin | Cria curso |
| GET | `/` | super_admin, coordenador, aluno | Lista todos os cursos |
| PATCH | `/:id` | super_admin | Atualiza curso |
| DELETE | `/:id` | super_admin | Remove curso (proteção: impede se houver vínculo) |

### 4.4 Regras (`/api/regras`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | super_admin | Cria regra de atividade |
| GET | `/` | super_admin, coordenador, aluno | Lista regras (filtrável por curso) |
| PATCH | `/:id` | super_admin | Atualiza regra |
| DELETE | `/:id` | super_admin | Remove regra (proteção: impede se houver submissão) |

### 4.5 Submissões (`/api/submissoes`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | aluno | Cria submissão (bloqueia se limite atingido ou já pendente) |
| GET | `/` | todos | Lista submissões (aluno vê só suas, coordenador as do curso) |
| GET | `/:id` | todos | Busca submissão por ID |
| PATCH | `/:id` | coordenador, super_admin | Avalia submissão (aprova/reprova/correção) |
| DELETE | `/:id` | aluno, coordenador, super_admin | Remove submissão |

### 4.6 Certificados (`/api/certificados`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | aluno | Upload de certificado com OCR (multer) |
| GET | `/` | todos | Lista certificados (filtrável por submissão_id) |

### 4.7 Vínculos Coordenador-Curso (`/api/coordenadores-cursos`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | super_admin | Vincula coordenador a curso |
| GET | `/` | super_admin | Lista vínculos (filtrável por curso) |
| DELETE | `/:id` | super_admin | Remove vínculo |

### 4.8 Vínculos Aluno-Curso (`/api/alunos-cursos`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| POST | `/` | coordenador, super_admin | Vincula aluno a curso |
| GET | `/` | todos | Lista vínculos (aluno vê só seus) |
| DELETE | `/:id` | coordenador, super_admin | Remove vínculo |

### 4.9 Dashboard (`/api/dashboard`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| GET | `/coordenador` | coordenador, super_admin | Métricas: total, pendentes, aprovadas, reprovadas, por área e por curso |
| GET | `/aluno` | aluno | Métricas: total, pendentes, aprovadas, horas por área, progresso |

### 4.10 Configurações (`/api/configuracoes`)

| Método | Rota | Perfil | Descrição |
|--------|------|--------|-----------|
| GET | `/:id` | super_admin | Busca configuração |
| POST | `/:id` | super_admin | Salva configuração (merge) |
| POST | `/test-email` | super_admin | Envia email de teste |

---

## 5. Regras de Negócio Importantes

### 5.1 Rollback em Cascata no Cadastro de Usuário

Ao criar um novo usuário via `POST /api/usuarios`, uma operação em cadeia é executada:

1. Cria usuário no **Firebase Auth**
2. Salva documento no **Firestore** (`usuarios`)
3. Se perfil for `aluno` + `curso_id` fornecido → cria vínculo em `alunos_cursos`

**Em caso de falha:**
- Se falhar no Firestore → deleta usuário do Auth (rollback)
- Se falhar no vínculo → desfaz vínculo criado → deleta Firestore → deleta Auth (rollback em cascata)

### 5.2 Vínculo Automático Aluno-Curso

Quando um usuário com perfil `aluno` é criado com `curso_id`:
- O vínculo em `alunos_cursos` é criado automaticamente no mesmo request
- O campo `curso_id` do usuário é preenchido em `usuarios`

### 5.3 Proteções no DELETE de Usuário

- **Coordenador** só pode excluir alunos (não outros coordenadores ou super_admin)
- **Coordenador** só pode excluir alunos vinculados ao seu curso
- **Super_admin** não pode ser o último do sistema
- Ao excluir **aluno**: remove vínculos em `alunos_cursos`
- Ao excluir **coordenador**: remove vínculos em `coordenadores_cursos`
- Após excluir do Firestore, tenta excluir do Firebase Auth (erro não bloqueante)

### 5.4 Validação de Submissão de Atividades

- **Bloqueia submissão** se aluno já possui submissão `pendente` para a mesma regra
- **Bloqueia submissão** se limite de horas da regra já foi atingido
- **Avisa** (não bloqueia) se horas solicitadas excedem o limite disponível
- Ao submeter: notifica coordenadores do curso por email

### 5.5 Avaliação de Submissão (PATCH /submissoes/:id)

- Status aceitos: `aprovado`, `reprovado`, `correcao`
- Se `aprovado` + `horas_aprovadas` fornecido → salva horas específicas
- Envia email ao aluno com resultado (exceto status `correcao`)

### 5.6 Validação de Regras de Exclusão

- **Curso**: não pode ser excluído se houver aluno ou coordenador vinculado
- **Regra**: não pode ser excluída se houver submissão vinculada
- **Submissão**: alunos só deletam se status for `pendente` ou `correcao`

### 5.7 Dashboard

- **Coordenador**: vê métricas dos cursos que coordena
- **Super_admin**: vê métricas de TODOS os cursos
- **Aluno**: vê suas próprias submissões, horas por área, progresso em relação à carga horária mínima do curso

---

## 6. Serviços Auxiliares

### 6.1 Serviço de Email (`services/email.js`)

**Configuração:** Busca do Firestore (`configuracoes/email_config`) com cache de 5 minutos. Fallback para variáveis de ambiente.

| Função | Descrição |
|--------|-----------|
| `enviarEmailCoordenador(email, nomeAluno)` | Notifica coordenador de nova submissão |
| `enviarEmailAluno(email, nomeAluno, status)` | Notifica aluno sobre avaliação |
| `enviarCredenciaisAcesso(email, nome, senha, perfil)` | Envia credenciais a novo usuário |
| `enviarEmailResetSenha(email, linkOuNull, isLink)` | Envia link ou notificação de reset |
| `clearEmailConfigCache()` | Limpa cache de configuração |

### 6.2 Serviço de OCR (`services/ocr.js`)

Usa a API **OCR.space** para extrair texto de imagens/PDFs.

```js
extrairTexto(fileBuffer, mimeType, nomeArquivo)
// Retorna texto extraído ou null em caso de erro
```

**Linguagem:** Português (`por`)
**Tipos suportados:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
**Chave:** `process.env.OCR_API_KEY`

### 6.3 Serviço de Logs (`services/logs.js`)

Registra ações em `logs` no Firestore. Não é crítico - erros não fazem rollback.

```js
registrarLog(usuario_id, acao, detalhes)
// Exemplo: registrarLog(req.usuario.uid, 'usuario_criado', { usuario_id: uid, perfil })
```

---

## 7. Coleções do Firestore e Campos

### 7.1 `usuarios`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | string | Nome completo |
| email | string | Email (único) |
| perfil | string | `super_admin`, `coordenador` ou `aluno` |
| matricula | string/null | Número de matrícula (alunos) |
| curso_id | string/null | ID do curso principal (alunos) |
| created_at | ISO string | Data de criação |

### 7.2 `cursos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | string | Nome do curso |
| carga_horaria_minima | number | Horas mínimas de atividades complementares |
| criado_por_admin_id | string | UID do super_admin que criou |
| created_at | ISO string | Data de criação |
| atualizado_por_admin_id | string/null | UID do admin que atualizou |
| updated_at | ISO string/null | Data de atualização |

### 7.3 `regras_atividade`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| area | string | Nome da área/categoria |
| limite_horas | number | Limite máximo de horas reconhecidas |
| exige_comprovante | boolean | Se requer comprovante |
| curso_id | string | ID do curso relacionado |
| criado_por_admin_id | string | UID do super_admin que criou |
| created_at | ISO string | Data de criação |
| atualizado_por_admin_id | string/null | UID do admin que atualizou |
| updated_at | ISO string/null | Data de atualização |

### 7.4 `submissoes`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| aluno_id | string | UID do aluno |
| coordenador_id | string/null | UID do coordenador que avaliou |
| regra_id | string | ID da regra de atividade |
| tipo | string | Tipo da atividade |
| descricao | string/null | Descrição |
| carga_horaria_solicitada | number | Horas solicitadas |
| status | string | `pendente`, `aprovado`, `reprovado`, `correcao` |
| horas_aprovadas | number/null | Horas efetivamente aprovadas |
| observacao | string/null | Observação do coordenador |
| data_envio | ISO string | Data de envio |
| data_validacao | ISO string/null | Data da avaliação |

### 7.5 `atividades_complementares`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| submissao_id | string | ID da submissão relateda |
| tipo | string | Tipo da atividade |
| descricao | string/null | Descrição |
| carga_horaria_solicitada | number | Horas solicitadas |

### 7.6 `certificados`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| submissao_id | string | ID da submissão |
| nome_arquivo | string | Nome original do arquivo |
| url_arquivo | string | URL pública no Firebase Storage |
| processado_ocr | boolean | Se passou por OCR |
| texto_extraido | string/null | Texto extraído via OCR |
| created_at | ISO string | Data de upload |

### 7.7 `alunos_cursos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID do aluno |
| curso_id | string | ID do curso |
| created_at | ISO string | Data de vínculo |

### 7.8 `coordenadores_cursos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID do coordenador |
| curso_id | string | ID do curso |
| created_at | ISO string | Data de vínculo |

### 7.9 `logs`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID de quem executou a ação |
| acao | string | Identificador da ação |
| detalhes | object | Dados complementares |
| criado_em | ISO string | Data/hora do log |

### 7.10 `configuracoes`

Documentos singleton por ID (`doc_id`):

- `email_config`: Configurações do servidor SMTP
- `sistema_config`: URL do frontend e outras configurações globais

---

## 8. Variáveis de Ambiente Necessárias

Criar arquivo `.env` na raiz do projeto (consulte `.env.example`):

```env
# Firebase
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=email@service-account.firebase
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
FIREBASE_STORAGE_BUCKET=seu-bucket.appspot.com
FIREBASE_API_KEY=sua-api-key

# Email
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# OCR
OCR_API_KEY=sua-chave-ocr-space

# Frontend (fallback)
FRONTEND_URL=http://localhost:8080
```

> **Nota:** `FIREBASE_PRIVATE_KEY` deve manter os `\n` literais para conversão correta.

---

## 9. Perfis de Usuário

| Perfil | Permissões |
|--------|------------|
| `super_admin` | Acesso total: gerencia cursos, regras, usuários, configurações |
| `coordenador` | Gerencia alunos vinculados ao seu curso, avalia submissões, vê dashboard |
| `aluno` | Submete atividades, acompanha status, vê seu dashboard |
