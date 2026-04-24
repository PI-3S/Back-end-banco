# Pasta middlewares/

## Descrição

Contém os middlewares da aplicação, responsáveis pela interceptação e processamento de requisições antes que cheguem às rotas.

## Arquivos

### auth.js

**Propósito:** Middleware de autenticação e autorização da aplicação.

**Funcionalidades:**

#### verificarToken
- Verifica se o token Bearer está presente no header Authorization
- Valida o token usando Firebase Auth
- Busca os dados do usuário no Firestore
- Adiciona o usuário ao objeto `req.usuario` para uso nas rotas

**Respostas de Erro:**
- `401` - Token não fornecido, inválido ou expirado
- `401` - Usuário não encontrado no Firestore

#### verificarPerfil(...perfisPermitidos)
- Factory function que cria um middleware de verificação de perfil
- Verifica se o perfil do usuário está na lista de perfis permitidos
- Deve ser usado após `verificarToken`

**Respostas de Erro:**
- `403` - Acesso negado (perfil não autorizado)

**Uso:**
```javascript
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

// Rota que requer apenas autenticação
router.get('/perfil', verificarToken, async (req, res) => {
  // req.usuario está disponível aqui
});

// Rota que requer perfil específico
router.post('/admin', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  // Apenas super_admin pode acessar
});

// Rota que aceita múltiplos perfis
router.post('/gerenciar', verificarToken, verificarPerfil('super_admin', 'coordenador'), async (req, res) => {
  // Super admin ou coordenador podem acessar
});
```