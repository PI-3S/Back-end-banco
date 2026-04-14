const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { enviarEmailCoordenador, clearEmailConfigCache } = require('../services/email');

const db = admin.firestore();

// GET /api/configuracoes/:id
router.get('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const doc = await db.collection('configuracoes').doc(req.params.id).get();
    res.json({ success: true, config: doc.exists ? doc.data() : null });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/configuracoes/:id
router.post('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('configuracoes').doc(id).set({
      ...req.body,
      updated_at: new Date().toISOString(),
      updated_by: req.usuario.uid
    }, { merge: true });
    
    // Limpa o cache de email se for email_config
    if (id === 'email_config') {
      clearEmailConfigCache();
    }
    
    res.json({ success: true, mensagem: 'Configuração salva!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/configuracoes/test-email
router.post('/test-email', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { to } = req.body;
    
    // Envia um email de teste
    const { enviarEmailCoordenador } = require('../services/email');
    await enviarEmailCoordenador(to, 'Administrador');
    
    res.json({ success: true, mensagem: 'Email de teste enviado!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;