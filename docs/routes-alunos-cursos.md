# Rotas - alunos_cursos.js

## Descrição

Rotas para gerenciamento de vínculos entre alunos e cursos.

## Endpoints

### POST /api/alunos-cursos

**Propósito:** Vincular um aluno a um curso.

**Permissões:** `coordenador`, `super_admin`

**Corpo da Requisição:**
```json
{
  "usuario_id": "aluno123",
  "curso_id": "curso123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "mensagem": "Aluno vinculado ao curso com sucesso!"
}
```

**Respostas de Erro:**
- `400` - usuario_id e curso_id são obrigatórios
- `400` - Usuário não é um aluno válido
- `400` - Curso não encontrado
- `400` - Aluno já vinculado a esse curso

**Observações:**
- Verifica se o usuário tem perfil "aluno"
- Verifica se o curso existe
- Impede vínculos duplicados
- Registra log de criação

---

### GET /api/alunos-cursos

**Propósito:** Listar vínculos de alunos com cursos.

**Permissões:** Todos os usuários autenticados

**Query Params:**
- `usuario_id` - Filtra por usuário (opcional)

**Comportamento por Perfil:**
- **aluno**: Vê apenas seus próprios vínculos (se não passar usuario_id)
- **coordenador/super_admin**: Vê todos ou filtra por usuario_id

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "vinculos": [
    {
      "id": "vinculo123",
      "curso_id": "curso123",
      "curso_nome": "Técnico em Informática",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Observações:**
- Inclui nome do curso na resposta

---

### DELETE /api/alunos-cursos/:id

**Propósito:** Remover vínculo entre aluno e curso.

**Permissões:** `coordenador`, `super_admin`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Vínculo removido com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Erro genérico

**Observações:**
- Não verifica se há submissões antes de remover