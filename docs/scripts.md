# Pasta scripts/

## Descrição

Contém scripts utilitários para setup e manutenção do sistema.

## Arquivos

### setup-firestore.js

**Propósito:** Script para setup inicial do Firestore, criando as coleções e documentos necessários.

**Funcionalidades:**
- Cria configurações padrão do sistema
- Inicializa estrutura de coleções
- Configurações de email
- Configurações do sistema

**Uso:**
```bash
node functions/scripts/setup-firestore.js
```

**Observações:**
- Deve ser executado após a primeira implantação
- Cria documentos na coleção `configuracoes`
- Útil para ambientes de desenvolvimento