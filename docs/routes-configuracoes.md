# Rotas - configuracoes.js

## Descrição

Rotas para gerenciamento de configurações do sistema.

## Endpoints

### GET /api/configuracoes/:id

**Propósito:** Buscar uma configuração específica.

**Permissões:** `super_admin`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "email@exemplo.com",
    "pass": "senha",
    "from": "SGC SENAC <email@exemplo.com>",
    "ativo": true
  }
}
```

**Observações:**
- IDs comuns: `email_config`, `sistema_config`

---

### POST /api/configuracoes/:id

**Propósito:** Salvar ou atualizar uma configuração.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "email@exemplo.com",
  "pass": "senha",
  "from": "SGC SENAC <email@exemplo.com>",
  "ativo": true
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Configuração salva!"
}
```

**Observações:**
- Usa merge: campos não fornecidos são mantidos
- Se for `email_config`, limpa o cache de configurações de email
- Registra quem fez a atualização

---

### POST /api/configuracoes/test-email

**Propósito:** Enviar um email de teste.

**Permissões:** `super_admin`

**Corpo da Requisição:**
```json
{
  "to": "destinatario@exemplo.com"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "mensagem": "Email de teste enviado!"
}
```

**Respostas de Erro:**
- `400` - Erro ao enviar email

**Observações:**
- Útil para testar configurações de email
- Envia email de notificação de nova submissão (template padrão)