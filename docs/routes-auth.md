# Rotas - auth.js

## Descrição

Rotas relacionadas à autenticação de usuários no sistema.

## Endpoints

### POST /api/auth/login

**Propósito:** Realiza login do usuário no sistema.

**Corpo da Requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "AEu4...",
  "usuario": {
    "uid": "abc123",
    "nome": "João Silva",
    "email": "usuario@exemplo.com",
    "perfil": "aluno",
    "curso_id": "curso123"
  }
}
```

**Respostas de Erro:**
- `401` - Email ou senha inválidos
- `404` - Usuário não encontrado no Firestore
- `400` - Erro genérico

**Observações:**
- Utiliza a API REST do Firebase Authentication
- Retorna token JWT para uso em requisições subsequentes
- Busca dados adicionais do usuário no Firestore

---

### POST /api/auth/forgot-password

**Propósito:** Solicita recuperação de senha via email.

**Corpo da Requisição:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Email de recuperação enviado com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Email não fornecido
- `404` - Email não encontrado no sistema
- `400` - Erro genérico

**Observações:**
- Gera um link de recuperação de senha usando Firebase Auth
- Envia email com o link de recuperação
- O link expira após um período determinado pelo Firebase