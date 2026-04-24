# Serviços - ocr.js

## Descrição

Serviço responsável pela extração de texto de imagens e PDFs usando OCR (Optical Character Recognition).

## Funcionalidades

### extrairTexto(fileBuffer, mimeType, nomeArquivo)

Extrai texto de um arquivo usando a API OCR.space.

**Parâmetros:**
- `fileBuffer` - Buffer do arquivo
- `mimeType` - Tipo MIME do arquivo
- `nomeArquivo` - Nome do arquivo

**Retorno:** String com o texto extraído ou null em caso de erro

**Tipos Suportados:**
- image/jpeg
- image/png
- image/webp
- application/pdf

**Exemplo de Uso:**
```javascript
const texto = await extrairTexto(req.file.buffer, req.file.mimetype, req.file.originalname);
```

## Configurações

### Variáveis de Ambiente

- `OCR_API_KEY` - Chave da API OCR.space

### Parâmetros da API

- `language` - "por" (português)
- `isOverlayRequired` - false (não requer overlay)

## Observações

- Utiliza a API OCR.space para processamento
- Retorna null se houver erro no processamento
- Usado principalmente no upload de certificados para validar conteúdo