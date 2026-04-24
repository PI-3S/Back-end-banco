# Rotas - cursos.js

## Descrição

Rotas para gerenciamento de cursos do sistema.

## Endpoints

### POST /api/cursos

**Propósito:** Criar um novo curso.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "nome": "Técnico em Informática",
  "carga_horaria_minima": 100
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "id": "curso123",
  "mensagem": "Curso criado com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Nome e carga horária são obrigatórios
- `400` - Erro ao criar curso

**Observações:**
- Carga horária mínima é usada para calcular progresso dos alunos
- Registra log de criação

---

### GET /api/cursos

**Propósito:** Listar todos os cursos.

**Permissões:** Todos os usuários autenticados

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "cursos": [
    {
      "id": "curso123",
      "nome": "Técnico em Informática",
      "carga_horaria_minima": 100,
      "criado_por_admin_id": "admin123",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### PATCH /api/cursos/:id

**Propósito:** Atualizar dados de um curso.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "nome": "Técnico em Informática - Atualizado",
  "carga_horaria_minima": 120
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Curso atualizado com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Pelo menos um campo deve ser fornecido
- `404` - Curso não encontrado

**Observações:**
- Pelo menos um campo deve ser fornecido
- Registra log de atualização

---

### DELETE /api/cursos/:id

**Propósito:** Excluir um curso.

**Permissões:** `super_admin`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Curso excluído com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Curso não encontrado
- `400` - Não é possível excluir: existem alunos vinculados
- `400` - Não é possível excluir: existem coordenadores vinculados

**Observações:**
- Verifica se há alunos vinculados antes de excluir
- Verifica se há coordenadores vinculados antes de excluir
- Registra log de exclusão