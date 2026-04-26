# Documentação do Banco de Dados — SGC SENAC

## 1. Visão Geral: Por que Firebase/Firestore

O SGC SENAC utiliza o **Firebase** como plataforma backend por três razões principais:

### 1.1 Autenticação Integrada
O Firebase Auth oferece autenticação segura via JWT sem necessidade de implementar servidores de sessão, hash de senhas ou controle de tokens. O `admin.auth().verifyIdToken()` valida tokens diretamente no Cloud Functions.

### 1.2 Firestore como Banco Flexível
O Firestore é um banco NoSQL orientado a documentos, ideal para:
- **Escalabilidade automática** — Serverless, não requer gestão de infraestrutura
- **Estrutura hierárquica** — Documentos dentro de coleções facilitam modelar entidades como `alunos_cursos` (vínculos) e `logs`
- **Consultas filtradas** — Suporte a `where()`, `in`, `orderBy()` para listagens por perfil/curso
- **Atualizações em tempo real** — Fácil de integrar com listeners no frontend

### 1.3 Storage Nativo para Certificados
O Firebase Storage integra-se ao Firestore — uploads via multer salvam arquivos e retornam URLs públicas diretamente nos documentos de `certificados`.

### 1.4 Ecossistema Google Cloud
- **Cloud Functions** para rodar a API serverless
- **IAM** para permissões via service account
- **SDK Admin** para operações privileged sem regras de segurança do cliente

---

## 2. Coleções do Firestore

### 2.1 `usuarios`

**Descrição:** Armazena os usuários do sistema (alunos, coordenadores e super_admin). O documento tem o mesmo ID do UID do Firebase Auth.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | string | Nome completo |
| email | string | Email (deve coincidir com Firebase Auth) |
| perfil | string | `super_admin`, `coordenador` ou `aluno` |
| matricula | string/null | Número de matrícula (alunos) |
| curso_id | string/null | ID do curso principal vinculado (alunos) |
| created_at | ISO string | Data de criação |

**Exemplo de documento real:**
```json
{
  "id": "abc123xyz",
  "nome": "Maria da Silva",
  "email": "maria@senac.br",
  "perfil": "aluno",
  "matricula": "202401029",
  "curso_id": "curso_tecnico_info",
  "created_at": "2024-03-15T09:30:00.000Z"
}
```

---

### 2.2 `cursos`

**Descrição:** Cursos oferecidos pela instituição. Cada curso define uma carga horária mínima de atividades complementares que os alunos devem cumprir.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | string | Nome do curso |
| carga_horaria_minima | number | Horas mínimas de atividades complementares |
| criado_por_admin_id | string | UID do super_admin que criou |
| created_at | ISO string | Data de criação |
| atualizado_por_admin_id | string/null | UID do super_admin que atualizou |
| updated_at | ISO string/null | Data de última atualização |

**Exemplo de documento real:**
```json
{
  "id": "curso_tecnico_info",
  "nome": "Técnico em Informática",
  "carga_horaria_minima": 200,
  "criado_por_admin_id": "admin_uid_001",
  "created_at": "2024-01-10T08:00:00.000Z"
}
```

---

### 2.3 `regras_atividade`

**Descrição:** Regras que definem áreas de atividade complementares, limites de horas aceitas e se exigem comprovante. Cada regra pertence a um curso específico.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| area | string | Nome da área/categoria (ex: "Estágio", "Voluntariado") |
| limite_horas | number | Limite máximo de horas reconhecidas para esta área |
| exige_comprovante | boolean | Se `true`, o aluno deve enviar certificado |
| curso_id | string | ID do curso ao qual a regra pertence |
| criado_por_admin_id | string | UID do super_admin que criou |
| created_at | ISO string | Data de criação |
| atualizado_por_admin_id | string/null | UID do super_admin que atualizou |
| updated_at | ISO string/null | Data de última atualização |

**Exemplo de documento real:**
```json
{
  "id": "regra_estagio_001",
  "area": "Estágio Curricular",
  "limite_horas": 80,
  "exige_comprovante": true,
  "curso_id": "curso_tecnico_info",
  "criado_por_admin_id": "admin_uid_001",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

---

### 2.4 `submissoes`

**Descrição:** Submissões de atividades complementares feitas por alunos. Cada submissão é vinculada a uma regra e passa por avaliação do coordenador.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| aluno_id | string | UID do aluno que submeteu |
| coordenador_id | string/null | UID do coordenador que avaliou |
| regra_id | string | ID da regra de atividade |
| tipo | string | Tipo/natureza da atividade |
| descricao | string/null | Descrição textual da atividade |
| carga_horaria_solicitada | number | Quantidade de horas solicitadas pelo aluno |
| status | string | `pendente`, `aprovado`, `reprovado` ou `correcao` |
| horas_aprovadas | number/null | Horas efetivamente aprovadas pelo coordenador |
| observacao | string/null | Feedback do coordenador ao aluno |
| data_envio | ISO string | Data/hora do envio pelo aluno |
| data_validacao | ISO string/null | Data/hora da avaliação pelo coordenador |

**Exemplo de documento real:**
```json
{
  "id": "submissao_001",
  "aluno_id": "aluno_uid_042",
  "coordenador_id": "coord_uid_007",
  "regra_id": "regra_estagio_001",
  "tipo": "Estágio em empresa",
  "descricao": "Estágio de 6 meses no setor de TI da empresa X",
  "carga_horaria_solicitada": 120,
  "status": "aprovado",
  "horas_aprovadas": 80,
  "observacao": "Horas limitadas ao máximo da regra",
  "data_envio": "2024-05-20T14:30:00.000Z",
  "data_validacao": "2024-05-22T09:15:00.000Z"
}
```

---

### 2.5 `atividades_complementares`

**Descrição:** Dados complementares da submissão (armazenados separadamente para retrocompatibilidade). Contém informações de tipo, descrição e carga horária que nem sempre estavam presentes nos documentos antigos de `submissoes`.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| submissao_id | string | ID do documento `submissoes` relacionado |
| tipo | string | Tipo da atividade |
| descricao | string/null | Descrição |
| carga_horaria_solicitada | number | Horas solicitadas |

**Exemplo de documento real:**
```json
{
  "id": "ativ_comp_001",
  "submissao_id": "submissao_001",
  "tipo": "Estágio em empresa",
  "descricao": "Estágio de 6 meses no setor de TI da empresa X",
  "carga_horaria_solicitada": 120
}
```

---

### 2.6 `certificados`

**Descrição:** Armazena metadados dos arquivos de certificado enviados pelos alunos. O arquivo em si é salvo no Firebase Storage; aqui ficam a referência à submissão, URL pública e texto extraído por OCR.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| submissao_id | string | ID da submissão associada |
| nome_arquivo | string | Nome original do arquivo enviado |
| url_arquivo | string | URL pública do arquivo no Firebase Storage |
| processado_ocr | boolean | Indica se passou pela extração de texto OCR |
| texto_extraido | string/null | Texto extraído do certificado via OCR.space |
| created_at | ISO string | Data do upload |

**Exemplo de documento real:**
```json
{
  "id": "cert_001",
  "submissao_id": "submissao_001",
  "nome_arquivo": "certificado_estagio.pdf",
  "url_arquivo": "https://storage.googleapis.com/sgc-senac.appspot.com/certificados/1716200000000_certificado_estagio.pdf",
  "processado_ocr": true,
  "texto_extraido": "CERTIFICADO...\nEste certificado reconhece que...\nCarga Horária: 120 horas",
  "created_at": "2024-05-20T15:00:00.000Z"
}
```

---

### 2.7 `alunos_cursos`

**Descrição:** Coleção de vínculos muitos-para-muitos entre alunos e cursos. Um aluno pode estar vinculado a múltiplos cursos (e vice-versa, um curso pode ter múltiplos alunos). Usada para filtrar quais alunos um coordenador pode gerenciar.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID do aluno (ref. `usuarios.id`) |
| curso_id | string | ID do curso (ref. `cursos.id`) |
| created_at | ISO string | Data do vínculo |

**Exemplo de documento real:**
```json
{
  "id": "vinculo_ac_001",
  "usuario_id": "aluno_uid_042",
  "curso_id": "curso_tecnico_info",
  "created_at": "2024-03-15T09:35:00.000Z"
}
```

---

### 2.8 `coordenadores_cursos`

**Descrição:** Vínculos muitos-para-muitos entre coordenadores e cursos. Usada para limitar quais submissões um coordenador pode avaliar (apenas dos cursos que coordena).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID do coordenador (ref. `usuarios.id`) |
| curso_id | string | ID do curso (ref. `cursos.id`) |
| created_at | ISO string | Data do vínculo |

**Exemplo de documento real:**
```json
{
  "id": "vinculo_cc_003",
  "usuario_id": "coord_uid_007",
  "curso_id": "curso_tecnico_info",
  "created_at": "2024-01-20T08:00:00.000Z"
}
```

---

### 2.9 `logs`

**Descrição:** Registro de auditoria de todas as ações importantes executadas no sistema. Não é crítico — falhas no registro de log não bloqueiam operações nem fazem rollback. Usado para rastreabilidade e suporte.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| usuario_id | string | UID de quem executou a ação |
| acao | string | Identificador da ação (ex: `usuario_criado`, `submissao_aprovado`) |
| detalhes | object | Dados complementares contextuais |
| criado_em | ISO string | Data/hora da ação |

**Exemplo de documento real:**
```json
{
  "id": "log_20240522001",
  "usuario_id": "coord_uid_007",
  "acao": "submissao_aprovado",
  "detalhes": {
    "submissao_id": "submissao_001"
  },
  "criado_em": "2024-05-22T09:15:00.000Z"
}
```

**Ações registradas:**

| Ação | Quando é registrada |
|------|----------------------|
| `usuario_criado` | Novo usuário cadastrado |
| `usuario_atualizado` | Dados de usuário alterados |
| `usuario_excluido` | Usuário removido |
| `senha_resetada` | Admin resetou senha |
| `curso_criado` | Novo curso criado |
| `curso_atualizado` | Curso alterado |
| `curso_excluido` | Curso removido |
| `regra_criada` | Nova regra criada |
| `regra_atualizada` | Regra alterada |
| `regra_excluida` | Regra removida |
| `submissao_criada` | Aluno enviou submissão |
| `submissao_aprovado` | Coordenador aprovou |
| `submissao_reprovado` | Coordenador reprovou |
| `submissao_correcao` | Coordinator solicitou correção |
| `submissao_deletada` | Submissão removida |
| `aluno_vinculado_curso` | Vínculo aluno-curso criado |
| `vinculo_coordenador_criado` | Vínculo coordenador-curso criado |
| `vinculo_coordenador_removido` | Vínculo coordenador-curso removido |

---

### 2.10 `configuracoes`

**Descrição:** Documentos singleton (por ID) para configurações globais do sistema. Não segue o padrão de coleção normal — cada documento é acessado diretamente por ID.

| ID do documento | Campos |
|-----------------|--------|
| `email_config` | `host`, `port`, `secure`, `user`, `pass`, `from`, `ativo`, `updated_at`, `updated_by` |
| `sistema_config` | `frontend_url`, `updated_at`, `updated_by` |

**Exemplo `email_config`:**
```json
{
  "id": "email_config",
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "sgcsenac@gmail.com",
  "pass": "xxxx xxxx xxxx xxxx",
  "from": "SGC SENAC <sgcsenac@gmail.com>",
  "ativo": true,
  "updated_at": "2024-04-01T10:00:00.000Z",
  "updated_by": "admin_uid_001"
}
```

---

## 3. Relacionamentos entre Coleções

```
                    ┌─────────────────┐
                    │    usuarios     │
                    │  (super_admin)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   coordenadores  │  │     cursos      │  │     regras      │
│   _cursos       │  │                 │  │  _atividade     │
│                 │  │                 │  │                 │
│ usuario_id ─────┼──┼──► curso_id     │  │ curso_id ───────┼──► curso_id
└─────────────────┘  └─────────────────┘  └────────┬────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   submissoes     │
                                        │                 │
                                        │ regra_id ────────┼──► regras_atividade.id
                                        │ aluno_id ────────┼──► usuarios.id
                                        │ coordenador_id ──┼──► usuarios.id (coordenador)
                                        └────────┬────────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                    │ atividades_     │ │   certificados   │ │     logs        │
                    │ complementares  │ │                 │ │                 │
                    │                 │ │                 │ │                 │
                    │ submissao_id ───┼─┼──► submissoes.id│ │ usuario_id ─────┼──► usuarios.id
                    └─────────────────┘ │ url_arquivo     │ └─────────────────┘
                                        └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │ Firebase Storage│
                                    │ (arquivos PDF/  │
                                    │  imagens)       │
                                    └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    usuarios     │     │  alunos_cursos  │
│    (aluno)      │     │                 │
│                 │◄────│  usuario_id    │
│  curso_id ──────┼───► │  curso_id       │
└─────────────────┘     └─────────────────┘
```

**Resumo dos relacionamentos:**

| De | Para | Via |
|----|------|-----|
| `usuarios` (aluno) | `cursos` | Campo `curso_id` em `usuarios` + coleção `alunos_cursos` |
| `usuarios` (coordenador) | `cursos` | Coleção `coordenadores_cursos` |
| `submissoes` | `usuarios` (aluno) | Campo `aluno_id` |
| `submissoes` | `usuarios` (coordenador) | Campo `coordenador_id` |
| `submissoes` | `regras_atividade` | Campo `regra_id` |
| `atividades_complementares` | `submissoes` | Campo `submissao_id` |
| `certificados` | `submissoes` | Campo `submissao_id` |
| `certificados` | Firebase Storage | Campo `url_arquivo` (URL pública) |

---

## 4. Regras de Negócio no Banco

### 4.1 Rollback em Cascata no Cadastro de Usuário (`usuarios` + `alunos_cursos`)

```
Criação de usuário (POST /api/usuarios):
┌─────────────────┐
│ 1. Firebase Auth: createUser()          │ ← cria no Auth
└────────┬────────┘
         │
         ▼ (sucesso)
┌─────────────────┐
│ 2. Firestore: usuarios.doc(uid).set()   │ ← salva perfil, nome, email, etc.
└────────┬────────┘
         │
    ┌────┴────┐
    │ falha?  │──► deleteUser(uid) do Auth → rollback completo
    └────┬────┘
         │ (sucesso)
         ▼
┌─────────────────────────┐
│ 3. Se perfil='aluno' +   │ ← vínculo automático
│    curso_id fornecido:   │
│    alunos_cursos.add()   │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ falha?  │──► busca vínculo criado → batch.delete() →
    └────┬────┘     usuarios.doc(uid).delete() →
         │          auth.deleteUser(uid) → rollback em cascata
    ┌────┴────┐
    │ sucesso │
    └────┬────┘
         ▼
┌─────────────────┐
│ 4. Log + Email  │ ← não bloqueia em caso de falha
└─────────────────┘
```

### 4.2 Proteção: Não Excluir Último Super Admin

```js
// DELETE /api/usuarios/:id
if (usuarioData.perfil === 'super_admin') {
  const superAdmins = await db.collection('usuarios')
    .where('perfil', '==', 'super_admin')
    .get();

  if (superAdmins.size <= 1) {
    return res.status(400).json({ error: 'Não é possível excluir o último super_admin' });
  }
}
```

### 4.3 Proteção: Coordenador Só Exclui Seus Alunos

```js
// DELETE /api/usuarios/:id (coordenador)
if (usuarioLogado.perfil === 'coordenador') {
  // 1) Só pode excluir alunos
  if (usuarioData.perfil !== 'aluno') { ... }

  // 2) Aluno deve pertencer a um dos cursos que o coordenador coordena
  const coordCursos = await db.collection('coordenadores_cursos')
    .where('usuario_id', '==', usuarioLogado.uid)
    .get();
  const cursosDoCoord = coordCursos.docs.map(d => d.data().curso_id);

  if (!cursosDoCoord.includes(usuarioData.curso_id)) {
    return res.status(403).json({ error: 'Você só pode excluir alunos do seu curso' });
  }
}
```

### 4.4 Exclusão em Cascata de Vínculos ao Remover Usuário

```js
// DELETE /api/usuarios/:id
if (usuarioData.perfil === 'aluno') {
  // Remove todos os vínculos do aluno com cursos
  const vinculosAluno = await db.collection('alunos_cursos')
    .where('usuario_id', '==', id)
    .get();
  const batch = db.batch();
  vinculosAluno.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

if (usuarioData.perfil === 'coordenador') {
  // Remove todos os vínculos do coordenador com cursos
  const vinculosCoord = await db.collection('coordenadores_cursos')
    .where('usuario_id', '==', id)
    .get();
  const batch = db.batch();
  vinculosCoord.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}
```

### 4.5 Impedir Exclusão de Curso com Vínculos Ativos

```js
// DELETE /api/cursos/:id
const alunosSnapshot = await db.collection('alunos_cursos')
  .where('curso_id', '==', id)
  .limit(1)
  .get();

if (!alunosSnapshot.empty) {
  return res.status(400).json({ error: 'Não é possível excluir: existem alunos vinculados' });
}

const coordenadoresSnapshot = await db.collection('coordenadores_cursos')
  .where('curso_id', '==', id)
  .limit(1)
  .get();

if (!coordenadoresSnapshot.empty) {
  return res.status(400).json({ error: 'Não é possível excluir: existem coordenadores vinculados' });
}
```

### 4.6 Impedir Exclusão de Regra com Submissões Vinculadas

```js
// DELETE /api/regras/:id
const submissoesSnapshot = await db.collection('submissoes')
  .where('regra_id', '==', id)
  .limit(1)
  .get();

if (!submissoesSnapshot.empty) {
  return res.status(400).json({ error: 'Não é possível excluir: existem submissões vinculadas' });
}
```

### 4.7 Bloqueio de Submissão Duplicada (Pendente)

```js
// POST /api/submissoes
// Bloqueia apenas se JÁ existe pendente — reprovadas/corretions não bloqueiam
const submissaoPendente = await db.collection('submissoes')
  .where('aluno_id', '==', req.usuario.uid)
  .where('regra_id', '==', regra_id)
  .where('status', '==', 'pendente')
  .get();

if (!submissaoPendente.empty) {
  return res.status(400).json({ error: 'Você já possui uma submissão pendente' });
}
```

### 4.8 Bloqueio de Submissão Quando Limite de Horas Atingido

```js
// POST /api/submissoes
// Calcula horas já aprovadas para esta regra
const submissoesAprovadas = await db.collection('submissoes')
  .where('aluno_id', '==', req.usuario.uid)
  .where('regra_id', '==', regra_id)
  .where('status', '==', 'aprovado')
  .get();

const horasJaAprovadas = ...; // soma horas de cada submissão aprovada

const horasDisponiveis = limiteHoras - horasJaAprovadas;

if (limiteHoras > 0 && horasDisponiveis <= 0) {
  return res.status(400).json({ error: `Limite de ${limiteHoras}h atingido` });
}
// Avisa se vai ultrapassar, mas não bloqueia:
// if (carga_horaria_solicitada > horasDisponiveis) { console.warn(...) }
```

### 4.9 Aluno Só Pode Deletar Submissões Pendentes ou em Correção

```js
// DELETE /api/submissoes/:id
if (req.usuario.perfil === 'aluno') {
  if (!['pendente', 'correcao'].includes(submissao.status)) {
    return res.status(400).json({ error: 'Só é possível deletar pendentes ou em correção' });
  }
}
```

---

## 5. Firebase Storage

### O que é armazenado

O Firebase Storage armazena os **arquivos de certificado** enviados pelos alunos (PDFs e imagens).

**Caminho de armazenamento:**
```
certificados/{timestamp}_{nome_original}
```

Exemplo: `certificados/1716200000000_certificado_estagio.pdf`

### Fluxo de Upload

```
Aluno envia arquivo
       │
       ▼
┌──────────────────────────┐
│ multer.memoryStorage()   │ ← arquivo em memória (não disco)
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ admin.storage().bucket() │
│   .file(caminho)         │
│   .save(buffer)           │ ← salva no Firebase Storage
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ file.makePublic()         │ ← torna público
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ URL pública gerada:      │
│ https://storage.googleapis.com/{bucket}/certificados/...
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ certificados.add({       │
│   url_arquivo: url,      │
│   ...                    │
│ })                       │ ← salva URL no Firestore
└──────────────────────────┘
```

### Tipos de arquivo aceitos

| MIME Type | Extensões |
|-----------|-----------|
| `image/jpeg` | .jpg, .jpeg |
| `image/png` | .png |
| `image/webp` | .webp |
| `application/pdf` | .pdf |

### OCR (extração de texto)

Após o upload, se o arquivo for de um tipo suportado, o serviço `extrairTexto()` da OCR.space é chamado para extrair o texto do certificado. O resultado é armazenado no campo `texto_extraido` do documento `certificados`.

---

## 6. Firebase Auth em Conjunto com Firestore

### Arquitetura de Autenticação

O sistema usa **dois mecanismos de autenticação em conjunto**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Auth                             │
│                                                              │
│  createUser({ email, password, displayName })                │
│  deleteUser(uid)                                            │
│  updateUser(uid, { password })                              │
│  generatePasswordResetLink(email)                            │
│  verifyIdToken(token) → decoded.uid                          │
│                                                              │
│  Armazena: email + senha hasheada + displayName              │
└───────────────────────────────┬─────────────────────────────┘
                                │ 1 uid por usuário
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore                                 │
│                                                              │
│  usuarios/{uid} → documento com perfil, nome, curso_id...   │
│                                                              │
│  O id do documento EM usuarios É o mesmo uid do Firebase    │
│  Auth — não há UID separado. Isso permite:                  │
│                                                              │
│  1. Verificar token JWT → obter uid → buscar doc em usuarios│
│  2. Criar usuário no Auth primeiro, depois no Firestore     │
│  3. Excluir do Auth (e rollback se Firestore falhar)         │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Login

```
POST /api/auth/login
┌─────────────────────────────────┐
│ 1. Firebase Auth:               │
│    signInWithPassword            │
│    (email + senha)               │
└────────────┬────────────────────┘
             │ retorna idToken + refreshToken
             ▼
┌─────────────────────────────────┐
│ 2. Firestore:                   │
│    usuarios.where(email==)       │
│    .get()                        │
└────────────┬────────────────────┘
             │ busca perfil + nome + curso_id
             ▼
┌─────────────────────────────────┐
│ 3. Resposta:                    │
│    { token, refreshToken,        │
│      usuario: { uid, nome,       │
│        email, perfil, curso_id } │
└─────────────────────────────────┘
```

### Fluxo de Validação de Token (middleware)

```js
// middlewares/auth.js
const verificarToken = async (req, res, next) => {
  const token = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token); // valida JWT
  const doc = await db.collection('usuarios').doc(decoded.uid).get(); // busca Firestore
  req.usuario = { uid: decoded.uid, ...doc.data() }; // anexa usuário ao request
  next();
};
```

O token JWT do Firebase contém o `uid`. O Firestore busca o documento correspondente para obter `perfil`, `nome`, `curso_id` e `matricula`.

---

## 7. Coleção de Logs — O que é Registrado

### Propósito

- **Auditoria**: saber quem fez o quê e quando
- **Suporte**: rastrear problemas reportados por usuários
- **Segurança**: identificar ações suspeitas
- **Compliance**: manter histórico para possíveis auditorias

### Características

- **Não crítico**: falhas no registro de log nunca bloqueiam operações
- **Escreva apenas**: logs nunca são lidos pela aplicação (são para consulta manual/admin)
- **Sem TTL**: não há expiração automática definida no código

### O que NÃO é logado

- Tentativas de login falhadas (trata no Firebase Auth)
- Operações de leitura (GETs)
- Ações de serviço de email ou OCR que falharam externamente

---

## 8. Coleção `configuracoes` — Campos e Uso

### Estrutura

Diferente das outras coleções, `configuracoes` não é uma coleção de múltiplos documentos — é uma coleção de **documentos singleton**, cada um identificado por um ID fixo.

### IDs conhecidos

| ID | Finalidade |
|----|------------|
| `email_config` | Configurações do servidor SMTP para envio de emails |
| `sistema_config` | URL do frontend e outras configurações globais |

### Como é acessada

```js
// Exemplo: ler email_config
const configDoc = await db.collection('configuracoes').doc('email_config').get();

// Exemplo: salvar email_config (com merge)
await db.collection('configuracoes').doc('email_config').set({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'xxx',
  pass: 'xxx',
  from: 'SGC SENAC <sgcsenac@gmail.com>',
  ativo: true,
  updated_at: new Date().toISOString(),
  updated_by: req.usuario.uid
}, { merge: true });

// Ao atualizar email_config, o cache é invalidado:
clearEmailConfigCache();
```

### Cache de Configuração

O serviço de email (`services/email.js`) mantém um **cache de 5 minutos** da configuração de email para evitar múltiplas leituras no Firestore a cada email enviado.

```js
const CACHE_TTL = 300000; // 5 minutos
let configCache = null;
let lastFetch = 0;

async function getEmailConfig() {
  if (configCache && (Date.now() - lastFetch) < CACHE_TTL) {
    return configCache; // retorna do cache
  }
  // busca no Firestore e atualiza cache
}
```

Ao salvar uma nova configuração via `POST /api/configuracoes/email_config`, o cache é invalidado automaticamente pela rota.
