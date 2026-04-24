# Rotas - coordenadores_cursos.js

## Descrição

Rotas para gerenciamento de vínculos entre coordenadores e cursos.

## Endpoints

### POST /api/coordenadores-cursos

**Propósito:** Vincular um coordenador a um curso.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "usuario_id": "coord123",
  "curso_id": "curso123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "id": "vinculo123",
  "mensagem": "Coordenador vinculado ao curso com sucesso!"
}
```

**Respostas de Erro:**
- `400` - usuario_id e curso_id são obrigatórios
- `400` - Usuário não é um coordenador válido
- `400` - Curso não encontrado
- `400` - Coordenador já vinculado a esse curso

**Observações:**
- Verifica se o usuário tem perfil "coordenador"
- Verifica se o curso existe
- Impede vínculos duplicados
- Registra log de criação

---

### GET /api/coordenadores-cursos

**Propósito:** Listar vínculos de coordenadores com cursos.

**Permissões:** `super_admin`

**Query Params:**
- `curso_id` - Filtra por curso (opcional)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "vinculos": [
    {
      "id": "vinculo123",
      "usuario_id": "coord123",
      "curso_id": "curso123",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### DELETE /api/coordenadores-cursos/:id

**Propósito:** Remover vínculo entre coordenador e curso.

**Permissões:** `super_admin`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Vínculo removido com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Vínculo não encontrado

**Observações:**
- Registra log de remoção