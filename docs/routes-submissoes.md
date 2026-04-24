# Rotas - submissoes.js

## Descrição

Rotas para gerenciamento de submissões de atividades complementares.

## Endpoints

### POST /api/submissoes

**Propósito:** Criar uma nova submissão de atividade complementar.

**Permissões:** `aluno`

**Corpo da Requisição:**
```json
{
  "regra_id": "regra123",
  "tipo": "Palestra",
  "descricao": "Palestra sobre IA no SENAC",
  "carga_horaria_solicitada": 4
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "id": "submissao123",
  "mensagem": "Submissão criada com sucesso!"
}
```

**Respostas de Erro:**
- `400` - regra_id, tipo e carga_horaria_solicitada são obrigatórios
- `400` - Regra não encontrada
- `400` - Você já possui uma submissão pendente para essa regra
- `400` - Você já atingiu o limite de horas para essa categoria

**Observações:**
- Bloqueia apenas se tiver submissão PENDENTE (aguardando avaliação)
- Calcula horas já aprovadas para verificar limite
- Avisa se a submissão ultrapassaria o limite disponível (mas não bloqueia)
- Envia email para coordenadores do curso
- Cria registro em `atividades_complementares`

---

### GET /api/submissoes

**Propósito:** Listar submissões.

**Permissões:** Todos os usuários autenticados

**Comportamento por Perfil:**
- **aluno**: Vê apenas suas submissões
- **coordenador**: Vê submissões dos cursos que coordena
- **super_admin**: Vê todas as submissões

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "submissoes": [
    {
      "id": "submissao123",
      "aluno_id": "aluno123",
      "regra_id": "regra123",
      "tipo": "Palestra",
      "descricao": "Palestra sobre IA no SENAC",
      "carga_horaria_solicitada": 4,
      "status": "pendente",
      "data_envio": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Observações:**
- Enriquece dados de submissões antigas com informações de `atividades_complementares`

---

### GET /api/submissoes/:id

**Propósito:** Buscar uma submissão específica.

**Permissões:** Todos os usuários autenticados

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "submissao": {
    "id": "submissao123",
    "aluno_id": "aluno123",
    "regra_id": "regra123",
    "tipo": "Palestra",
    "descricao": "Palestra sobre IA no SENAC",
    "carga_horaria_solicitada": 4,
    "status": "pendente",
    "data_envio": "2024-01-01T00:00:00.000Z"
  }
}
```

**Respostas de Erro:**
- `404` - Submissão não encontrada

---

### PATCH /api/submissoes/:id

**Propósito:** Avaliar uma submissão (aprovado/reprovado/correcao).

**Permissões:** `coordenador`, `super_admin`

**Corpo da Requisição:**
```json
{
  "status": "aprovado",
  "observacao": "Atividade válida",
  "horas_aprovadas": 4
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Submissão aprovado com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Status deve ser aprovado, reprovado ou correcao

**Observações:**
- `horas_aprovadas` é obrigatório quando status é "aprovado"
- Envia email para o aluno (exceto quando status é "correcao")
- Registra log da ação

---

### DELETE /api/submissoes/:id

**Propósito:** Excluir uma submissão.

**Permissões:** Todos os usuários autenticados

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Submissão deletada com sucesso!"
}
```

**Respostas de Erro:**
- `404` - Submissão não encontrada
- `403` - Você não tem permissão para deletar esta submissão
- `400` - Só é possível deletar submissões pendentes ou em correção

**Observações:**
- Alunos só podem deletar suas próprias submissões
- Só é possível deletar submissões com status "pendente" ou "correcao"
- Remove também registros de `atividades_complementares`