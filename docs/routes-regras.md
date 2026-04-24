# Rotas - regras.js

## Descrição

Rotas para gerenciamento de regras de atividades complementares.

## Endpoints

### POST /api/regras

**Propósito:** Criar uma nova regra de atividade complementar.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "area": "Palestras",
  "limite_horas": 20,
  "exige_comprovante": true,
  "curso_id": "curso123"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "id": "regra123",
  "mensagem": "Regra criada com sucesso!"
}
```

**Respostas de Erro:**
- `400` - area, limite_horas e curso_id são obrigatórios
- `400` - Curso não encontrado
- `400` - Já existe uma regra para essa área nesse curso

**Observações:**
- Não pode haver duas regras com a mesma área no mesmo curso
- `limite_horas` define o máximo de horas aceitas para essa área
- `exige_comprovante` indica se é necessário anexar certificado

---

### GET /api/regras

**Propósito:** Listar regras de atividades complementares.

**Permissões:** Todos os usuários autenticados

**Query Params:**
- `curso_id` - Filtra por curso (opcional)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "regras": [
    {
      "id": "regra123",
      "area": "Palestras",
      "limite_horas": 20,
      "exige_comprovante": true,
      "curso_id": "curso123",
      "criado_por_admin_id": "admin123",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### PATCH /api/regras/:id

**Propósito:** Atualizar uma regra existente.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "area": "Palestras e Seminários",
  "limite_horas": 25,
  "exige_comprovante": false
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Regra atualizada com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Regra não encontrada
- `400` - Já existe uma regra para essa área nesse curso

**Observações:**
- Se mudar curso_id ou area, verifica duplicidade
- Registra log de atualização

---

### DELETE /api/regras/:id

**Propósito:** Excluir uma regra.

**Permissões:** `super_admin`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Regra excluída com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Regra não encontrada
- `400` - Não é possível excluir: existem submissões vinculadas a esta regra

**Observações:**
- Verifica se há submissões usando esta regra antes de excluir
- Registra log de exclusão