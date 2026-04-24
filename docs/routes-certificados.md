# Rotas - certificados.js

## Descrição

Rotas para upload e gerenciamento de certificados de atividades complementares.

## Endpoints

### POST /api/certificados

**Propósito:** Fazer upload de um certificado para uma submissão.

**Permissões:** `aluno`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `arquivo` - Arquivo do certificado (obrigatório)
- `submissao_id` - ID da submissão (obrigatório)

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "id": "cert123",
  "url_arquivo": "https://storage.googleapis.com/bucket/certificados/1234567890_certificado.pdf",
  "texto_extraido": "Texto extraído do certificado via OCR...",
  "mensagem": "Certificado enviado com sucesso!"
}
```

**Respostas de Erro:**
- `400` - Arquivo é obrigatório
- `400` - submissao_id é obrigatório
- `400` - Submissão não encontrada
- `403` - Você não tem permissão para enviar certificado nessa submissão
- `400` - Essa submissão já possui um certificado enviado

**Observações:**
- Salva arquivo no Firebase Storage
- Processa OCR para extrair texto (se for imagem ou PDF)
- Tipos suportados para OCR: image/jpeg, image/png, image/webp, application/pdf
- Torna o arquivo público
- Aluno só pode enviar certificado para suas próprias submissões

---

### GET /api/certificados

**Propósito:** Listar certificados.

**Permissões:** Todos os usuários autenticados

**Query Params:**
- `submissao_id` - Filtra por submissão (opcional)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "certificados": [
    {
      "id": "cert123",
      "submissao_id": "submissao123",
      "nome_arquivo": "certificado.pdf",
      "url_arquivo": "https://storage.googleapis.com/bucket/certificados/1234567890_certificado.pdf",
      "processado_ocr": true,
      "texto_extraido": "Texto extraído...",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Observações:**
- Se submissao_id for fornecido, retorna apenas certificados dessa submissão