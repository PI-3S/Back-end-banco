# Pasta config/

## Descrição

Contém as configurações de inicialização do Firebase Admin SDK.

## Arquivos

### firebase.js

**Propósito:** Inicializa o Firebase Admin SDK com as credenciais do projeto.

**Funcionalidades:**
- Configura o Firebase Admin com credenciais do service account
- Configura o bucket do Firebase Storage
- Exporta a instância do admin para uso em toda a aplicação

**Variáveis de Ambiente Utilizadas:**
- `FIREBASE_PROJECT_ID` - ID do projeto Firebase
- `FIREBASE_CLIENT_EMAIL` - Email da service account
- `FIREBASE_PRIVATE_KEY` - Chave privada da service account
- `FIREBASE_STORAGE_BUCKET` - Nome do bucket de storage

**Uso:**
```javascript
const admin = require('./config/firebase');
const db = admin.firestore();
const auth = admin.auth();
const bucket = admin.storage().bucket();
```