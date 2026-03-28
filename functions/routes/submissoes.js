const express = require('express');
const router = express.Router();
// Correção: Usando a instância db pronta
const { db } = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

// GET /api/submissoes
router.get('/', verificarToken, async (req, res) => {
  try {
    let query = db.collection('submissoes');
    if (req.usuario.perfil === 'aluno') {
      query = query.where('aluno_id', '==', req.usuario.uid);
    }
    const snapshot = await query.get();
    const submissoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, submissoes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;