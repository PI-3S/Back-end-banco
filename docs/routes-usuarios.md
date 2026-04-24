# Rotas - usuarios.js

## Descrição

Rotas para gerenciamento de usuários do sistema (CRUD completo).

## Endpoints

### POST /api/usuarios

**Propósito:** Criar um novo usuário no sistema.

**Permissões:** `super_admin`, `coordenador`

**Corpo da Requisição:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "perfil": "aluno",
  "matricula": "2024001",
  "curso_id": "curso123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "uid": "abc123",
  "mensagem": "Usuário criado com sucesso! As credenciais foram enviadas por email.",
  "emailEnviado": true
}
```

**Respostas de Erro:**
- `400` - Perfil inválido
- `400` - Erro ao criar usuário

**Observações:**
- Cria usuário no Firebase Authentication
- Cria documento no Firestore
- Envia email com credenciais de acesso
- Coordenadores só podem criar alunos

---

### GET /api/usuarios

**Propósito:** Listar usuários do sistema.

**Permissões:** `super_admin`, `coordenador`

**Query Params:**
- `perfil` - Filtra por perfil (opcional)
- `curso_id` - Filtra por curso (opcional)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "usuarios": [
    {
      "id": "abc123",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "perfil": "aluno",
      "curso_id": "curso123",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Observações:**
- Coordenadores veem apenas alunos dos cursos que coordenam
- Super admin vê todos os usuários
- Filtro por curso_id retorna apenas alunos vinculados

---

### PATCH /api/usuarios/:id

**Propósito:** Atualizar dados de um usuário.

**Permissões:** `super_admin`, `coordenador`

**Corpo da Requisição:**
```json
{
  "nome": "João Silva Jr.",
  "curso_id": "curso456",
  "matricula": "2024002"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Usuário atualizado com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Usuário não encontrado
- `403` - Coordenador tentando atualizar não-aluno

**Observações:**
- Coordenadores só podem atualizar alunos
- Não é possível alterar perfil ou email

---

### DELETE /api/usuarios/:id

**Propósito:** Excluir um usuário do sistema.

**Permissões:** `super_admin`, `coordenador`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Usuário excluído com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Usuário não encontrado
- `403` - Coordenador tentando excluir não-aluno
- `403` - Coordenador tentando excluir aluno de outro curso
- `400` - Tentativa de excluir o último super_admin

**Observações:**
- Remove usuário do Firestore
- Remove usuário do Firebase Authentication
- Remove vínculos com cursos (alunos_cursos ou coordenadores_cursos)
- Coordenadores só podem excluir alunos de seus cursos

---

### POST /api/usuarios/:id/reset-senha

**Propósito:** Resetar senha de um usuário (apenas super_admin).

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "novaSenha": "novaSenha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Senha resetada com sucesso! O usuário foi notificado por email."
}
```

**Respostas de Erro:**
- `400` - Senha deve ter no mínimo 6 caracteres
- `404` - Usuário não encontrado

**Observações:**
- Atualiza senha no Firebase Authentication
- Envia email notificando o usuário
- Recomenda-se que o usuário troque a senha no próximo acesso