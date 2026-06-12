# Reuso, Componentização e Qualidade do Código

## 1. Reuso e Componentização

### 1.1 Middlewares Reutilizáveis

O arquivo `middlewares/auth.js` exporta funções usadas em **todos** os módulos de rota:

```js
// verificarToken — reutilizado em cada rota autenticada
router.get('/', verificarToken, handler);

// exigirPerfil — factory que gera middleware de autorização
router.post('/', verificarToken, exigirPerfil('super_admin'), handler);
router.patch('/:id', verificarToken, exigirPerfil('coordenador', 'super_admin'), handler);
```

Benefício: a lógica de autenticação e autorização existe em **um único lugar** e é aplicada declarativamente em cada rota.

### 1.2 Serviços Compartilhados

Três serviços são reutilizados em múltiplos módulos:

**`services/email.js`** — consumido por:
- `routes/usuarios.js` → envia credenciais ao criar usuário
- `routes/submissoes.js` → notifica coordenadores e alunos
- `routes/auth.js` → envia link de recuperação de senha
- `routes/configuracoes.js` → envia email de teste

**`services/logs.js`** — consumido por:
- Todos os módulos de rota para auditoria de ações críticas

**`services/ocr.js`** — consumido por:
- `routes/certificados.js` → extrai texto de PDFs e imagens

### 1.3 Configuração Centralizada (Singleton)

`config/firebase.js` inicializa o Firebase Admin SDK uma vez e é importado por todos os módulos:

```js
// config/firebase.js — inicialização única
const admin = require('firebase-admin');
// ...configuração...
module.exports = admin;

// Em qualquer módulo
const admin = require('./config/firebase');
const db = admin.firestore();
```

### 1.4 Padrão de Resposta Consistente

Todos os endpoints seguem o mesmo formato de resposta, permitindo que o frontend reutilize um único handler de erros:

```js
// Sucesso
res.status(200).json({ dados, mensagem });

// Erro de cliente
res.status(400).json({ error: 'Descrição do problema' });

// Não autorizado
res.status(403).json({ error: 'Sem permissão para esta operação' });

// Erro de servidor
res.status(500).json({ error: 'Erro interno do servidor' });
```

### 1.5 Cache de Configuração no Serviço de Email

`services/email.js` implementa cache interno para evitar leituras repetidas ao Firestore:

```
Primeira chamada → lê configuração do Firestore → armazena em memória (5 min TTL)
Chamadas seguintes → usa cache → sem custo de leitura ao banco
```

Componente reutilizável com otimização de performance embutida.

---

## 2. Qualidade e Refatoração do Código

### 2.1 Separação de Responsabilidades

Cada arquivo tem uma única responsabilidade clara:

| Arquivo | Responsabilidade |
|---------|-----------------|
| `index.js` | Composição da aplicação, montagem de rotas |
| `config/firebase.js` | Inicialização de infraestrutura |
| `middlewares/auth.js` | Segurança transversal |
| `routes/*.js` | Lógica de negócio por domínio |
| `services/email.js` | Comunicação por email |
| `services/ocr.js` | Extração de texto |
| `services/logs.js` | Auditoria |

### 2.2 Validação nas Bordas do Sistema

Validação de entrada ocorre na camada de rotas, antes de qualquer operação:

```js
// Validação de campos obrigatórios antes de chamar o banco
if (!nome || !email || !perfil) {
  return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
}

// Validação de valores permitidos
const perfisValidos = ['super_admin', 'coordenador', 'aluno'];
if (!perfisValidos.includes(perfil)) {
  return res.status(400).json({ error: 'Perfil inválido' });
}
```

### 2.3 Regras de Negócio Explícitas

Regras de negócio são verificadas antes das operações, com mensagens de erro descritivas:

```js
// Proteção: super_admin não pode ser o último do sistema
const adminAtivos = await db.collection('usuarios')
  .where('perfil', '==', 'super_admin').get();
if (adminAtivos.size <= 1) {
  return res.status(400).json({
    error: 'Não é possível remover o único super_admin'
  });
}

// Proteção: curso com vínculos não pode ser excluído
const alunosVinculados = await db.collection('alunos_cursos')
  .where('curso_id', '==', id).get();
if (!alunosVinculados.empty) {
  return res.status(400).json({
    error: 'Curso possui alunos vinculados'
  });
}
```

### 2.4 Tratamento de Erros Consistente

Todos os handlers usam try/catch com logging de erro:

```js
try {
  // operação
} catch (error) {
  console.error('Descrição do contexto:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
}
```

Erros não críticos (ex: logging) não propagam falha para o usuário:

```js
// Falha no log não impede a operação principal
try {
  await registrarLog(usuario_id, 'acao', detalhes);
} catch (logError) {
  console.error('Erro ao registrar log:', logError);
  // Não re-throw — log é não crítico
}
```

### 2.5 Rollback em Cascata (Consistência sem Transações Nativas)

O cadastro de usuário implementa consistência entre Firebase Auth e Firestore via rollback manual:

```js
let authCriado = false;
let firestoreCriado = false;

try {
  // 1. Firebase Auth
  const userRecord = await admin.auth().createUser({ email, password: senha });
  authCriado = true;

  // 2. Firestore
  await db.collection('usuarios').doc(uid).set(dados);
  firestoreCriado = true;

  // 3. Vínculo (se aluno)
  if (perfil === 'aluno' && curso_id) {
    await db.collection('alunos_cursos').add({ usuario_id: uid, curso_id });
  }
} catch (error) {
  // Rollback em ordem inversa
  if (firestoreCriado) await db.collection('usuarios').doc(uid).delete();
  if (authCriado) await admin.auth().deleteUser(uid);
  throw error;
}
```

### 2.6 Controle de Acesso Granular

Além do controle por perfil, há verificações de ownership nos dados:

```js
// Coordenador só vê alunos do seu curso
if (usuario.perfil === 'coordenador') {
  query = query.where('curso_id', '==', usuario.curso_id);
}

// Aluno só vê suas próprias submissões
if (usuario.perfil === 'aluno') {
  query = query.where('aluno_id', '==', usuario.uid);
}
```

### 2.7 Nomeação e Clareza

- Arquivos nomeados pelo domínio que representam (`cursos.js`, `submissoes.js`)
- Variáveis nomeadas em português para alinhamento com o domínio do negócio
- Funções de serviço nomeadas com verbo + substantivo (`enviarEmailAluno`, `registrarLog`, `extrairTexto`)
- Constantes para valores fixos (`const perfisValidos = [...]`)

---

## 3. Gestão de Configuração

### 3.1 Variáveis de Ambiente

Toda configuração sensível é externalizada via `.env`:
- Credenciais Firebase
- Credenciais SMTP
- Chave da API de OCR
- URL do frontend

### 3.2 Configuração Dinâmica

Configurações do sistema (SMTP) podem ser alteradas em runtime via API sem redeploy:

```
POST /api/configuracoes/email_config
```

O serviço de email lê do Firestore com cache, garantindo configurações atualizadas.

### 3.3 Separação de Ambientes

- Desenvolvimento: `npm run dev` com nodemon, `.env` local
- Produção Vercel: variáveis de ambiente na plataforma
- Produção Firebase: `firebase deploy`, variáveis via Firebase config

---

## 4. Versionamento e Gestão de Código

### 4.1 Estrutura do Repositório

```
Back-end-banco/          ← raiz do repositório
├── docs/                ← documentação (versionada junto ao código)
└── functions/           ← código da aplicação
```

Documentação fica no mesmo repositório que o código, garantindo que ambos evoluam juntos.

### 4.2 .gitignore

Arquivos sensíveis e gerados são excluídos do controle de versão:
- `node_modules/`
- `.env` (credenciais)
- Arquivos de build

### 4.3 Rastreabilidade

Cada ação relevante do sistema é registrada em `logs/` no Firestore com:
- `usuario_id` — quem executou
- `acao` — o que foi feito
- `detalhes` — contexto da ação
- `criado_em` — quando ocorreu

Permite auditoria completa das operações do sistema.
