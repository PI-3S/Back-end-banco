# Roteiro de Apresentação — SGC SENAC (Backend)

> Roteiro para apresentação oral. Adaptar conforme o tempo disponível.
> Juntar com roteiro do frontend para apresentação completa.

---

## 1. Introdução — O que é o sistema? (1-2 min)

**Falar:**

> "O SGC SENAC é um Sistema de Gestão de Certificados desenvolvido para o SENAC.
> O objetivo é automatizar o controle de atividades complementares curriculares.
> Antes, esse processo era manual. Com o sistema, o aluno envia a atividade,
> o coordenador avalia, e o sistema calcula automaticamente as horas e o progresso."

**Três atores no sistema:**
- **Aluno** — envia atividades e acompanha progresso
- **Coordenador** — avalia submissões dos alunos do seu curso
- **Super Admin** — gerencia cursos, regras, usuários e configurações

---

## 2. Arquitetura do Sistema (2-3 min)

**Falar:**

> "O sistema é dividido em frontend e backend separados, se comunicando via API REST com JSON."

```
[Frontend PWA/Web]  →  HTTPS + JSON  →  [API REST - Node.js/Express]
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                              Firebase Auth    Firestore      Cloud Storage
                              (Autenticação)  (Banco NoSQL)  (Certificados)
```

**Organização em camadas — mostrar pasta `functions/`:**

> "O backend segue arquitetura em camadas com responsabilidades separadas:"

| Camada | Arquivo | Responsabilidade |
| ------ | ------- | ---------------- |
| Rotas | `routes/*.js` | Recebe requisição, valida, orquestra |
| Middleware | `middlewares/auth.js` | Autenticação e autorização |
| Serviços | `services/*.js` | Lógica reutilizável |
| Infraestrutura | Firebase | Banco, auth, storage |

**Ponto importante para o professor:**
> "Essa separação garante que cada parte do sistema tem uma única responsabilidade,
> facilitando manutenção e evolução."

---

## 3. Modelagem e Organização (1-2 min)

**Mostrar estrutura de pastas:**

```
functions/
├── index.js               ← monta a aplicação
├── config/firebase.js     ← configuração centralizada
├── middlewares/auth.js    ← segurança
├── routes/                ← 10 módulos de domínio
│   ├── auth.js
│   ├── usuarios.js
│   ├── cursos.js
│   ├── regras.js
│   ├── submissoes.js
│   ├── certificados.js
│   ├── dashboard.js
│   └── ...
└── services/              ← serviços reutilizáveis
    ├── email.js
    ├── ocr.js
    └── logs.js
```

**Falar:**
> "Cada domínio do negócio tem seu próprio módulo. Usuários, cursos, submissões —
> cada um é independente. Isso é modularização: isolar responsabilidades para
> facilitar manutenção e evolução do sistema."

**Banco de dados — Coleções no Firestore:**
> "Modelamos 10 coleções no Firestore representando as entidades do negócio:
> usuarios, cursos, regras_atividade, submissoes, certificados, logs, entre outras."

---

## 4. Reuso e Componentização (2-3 min) — PONTO MAIS PESADO

**Falar:**
> "Reuso foi um princípio central no desenvolvimento. Em vez de repetir código,
> criamos componentes reutilizáveis usados em todo o sistema."

### Middleware reutilizável — mostrar `middlewares/auth.js`

> "O middleware de autenticação é escrito uma única vez e aplicado em todas as rotas:"

```js
// Usado em TODAS as rotas autenticadas
router.get('/', verificarToken, handler);
router.post('/', verificarToken, exigirPerfil('super_admin'), handler);
```

> "Se precisarmos mudar a lógica de autenticação, mudamos em um só lugar.
> Sem isso, teríamos que replicar o mesmo código em 10 arquivos diferentes."

### Serviços reutilizáveis — mostrar pasta `services/`

| Serviço | Usado por |
| ------- | --------- |
| `email.js` | usuarios, submissoes, auth, configuracoes |
| `logs.js` | todos os módulos de rota |
| `ocr.js` | certificados |

> "O serviço de email, por exemplo, é chamado quando um usuário é criado,
> quando uma submissão é avaliada, e quando uma senha é recuperada.
> Mesmo código, zero duplicação."

### Singleton — `config/firebase.js`

> "O Firebase é inicializado uma única vez e compartilhado por todos os módulos.
> Esse é o padrão Singleton: uma instância, usada em todo o sistema."

---

## 5. Qualidade e Refatoração do Código (2-3 min) — PONTO MAIS PESADO

### Rollback em cascata — mostrar `routes/usuarios.js`

**Falar:**
> "Um exemplo de qualidade é o cadastro de usuário. Ele opera em três sistemas:
> Firebase Auth, Firestore e tabela de vínculos. Se qualquer etapa falhar,
> o sistema desfaz tudo automaticamente — como uma transação bancária."

```
1. Cria no Firebase Auth        → falha? para aqui
2. Salva no Firestore           → falha? deleta do Auth
3. Cria vínculo aluno-curso     → falha? deleta Firestore + Auth
```

> "Isso garante consistência dos dados mesmo sem transações nativas entre sistemas diferentes."

### Validação nas bordas

> "Toda entrada do usuário é validada antes de qualquer operação no banco:"

```js
if (!nome || !email || !perfil) {
  return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
}
```

### Regras de negócio explícitas

> "As regras de negócio estão no código de forma clara:"
- Super admin não pode ser excluído se for o último do sistema
- Curso com alunos vinculados não pode ser excluído
- Aluno não pode enviar nova submissão se já tem uma pendente para a mesma regra

### Nomeação e clareza

> "Arquivos nomeados pelo domínio, funções com verbo + substantivo:
> `enviarEmailAluno`, `registrarLog`, `extrairTexto`. Código legível sem precisar de comentários."

---

## 6. Integração — Como o Frontend consome a API (1-2 min)

**Falar:**
> "O frontend se comunica com o backend via HTTP, enviando e recebendo JSON.
> A autenticação usa Bearer Token em todas as requisições protegidas."

**Fluxo de login:**
```
1. Frontend POST /api/auth/login {email, senha}
2. Backend valida no Firebase Auth
3. Retorna JWT token + dados do usuário
4. Frontend armazena token e envia em cada requisição
```

**Fluxo de submissão (aluno):**
```
1. Aluno preenche formulário
2. Frontend POST /api/submissoes
3. Backend valida regras e salva
4. Email automático enviado aos coordenadores
5. Aluno faz upload do certificado → OCR extrai texto automaticamente
```

---

## 7. Padrões de Projeto Aplicados (1 min)

**Falar:**
> "Aplicamos padrões de projeto reconhecidos pela engenharia de software:"

| Padrão | Onde |
| ------ | ---- |
| **Middleware Pattern** (Chain of Responsibility) | `auth.js` encadeado nas rotas |
| **Service Layer** | `services/` isolados das rotas |
| **Singleton** | `config/firebase.js` |
| **Module Pattern** | cada domínio em arquivo próprio |
| **RBAC** (Role-Based Access Control) | 3 perfis com permissões distintas |

---

## 8. GitHub e Versionamento (30 seg)

**Mostrar no GitHub:**
> "Usamos Git com histórico de commits descritivo. Documentação versionada junto ao código.
> `.gitignore` configurado para não commitar credenciais."

---

## 9. Documentação (30 seg)

**Mostrar pasta `docs/`:**

> "Organizamos 5 documentos essenciais:"

- `ARQUITETURA.md` — arquitetura, camadas, decisões técnicas
- `DOCUMENTACAO-TECNICA-BACKEND.md` — referência completa de endpoints
- `REUSO-QUALIDADE.md` — reuso, qualidade, configuração
- `api-exemplos-frontend.md` — guia de integração para o frontend
- `README.md` raiz — visão geral do repositório

---

## Perguntas Prováveis e Respostas

**"Por que Firebase e não banco relacional?"**
> Firebase oferece Auth, banco e storage em um único serviço gerenciado.
> Elimina necessidade de servidor de banco de dados, reduz complexidade operacional
> e tem integração nativa com autenticação.

**"O que é RBAC?"**
> Role-Based Access Control — controle de acesso baseado em perfil.
> Cada perfil (super_admin, coordenador, aluno) tem permissões diferentes,
> verificadas pelo middleware antes de qualquer operação.

**"Como garante consistência dos dados?"**
> Rollback em cascata manual no cadastro de usuário.
> Se qualquer etapa falhar, desfazemos as etapas anteriores na ordem inversa.

**"O que é reuso neste projeto?"**
> Middleware de autenticação escrito uma vez, usado em todas as rotas.
> Serviços de email, OCR e log reutilizados por múltiplos módulos.
> Config Firebase como singleton compartilhado por todo o sistema.

**"Qual padrão de projeto você usaria para descrever o middleware?"**
> Chain of Responsibility — a requisição passa por uma cadeia de handlers
> (verificarToken → exigirPerfil → handler) e cada um decide se passa adiante ou retorna erro.

**"Como o frontend sabe o que o usuário pode fazer?"**
> No login, o backend retorna o perfil do usuário junto com o token.
> O frontend usa esse perfil para mostrar/esconder funcionalidades.
> Mas a proteção real está no backend — o middleware bloqueia no servidor.

---

## Pontuação Esperada

| Critério | Pts | O que mostrar |
| -------- | --- | ------------- |
| Arquitetura | 1,5 | Diagrama, camadas, separação frontend/backend |
| Reuso e componentização | 2,0 | `auth.js`, `services/`, singleton |
| Qualidade e refatoração | 2,0 | Rollback, validação, regras de negócio |
| Organização e modularização | 1,0 | Estrutura de pastas, 10 módulos de rota |
| Integração Mobile/API/PWA | 0,5 | Fluxo JSON, exemplos frontend |
| Boas práticas/padrões | 0,5 | RBAC, REST, padrões de projeto |
| GitHub e versionamento | 0,5 | Histórico de commits, organização do repo |
| Documentação | 0,5 | Pasta `docs/`, 5 arquivos organizados |
| Interface e usabilidade | 0,5 | (frontend — completar com roteiro do front) |

**Total backend contribui para: ~8,0 dos 9,0 pontos possíveis**
