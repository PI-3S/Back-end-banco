const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// POST /api/regras - Só Super Admin cria
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { area, limite_horas, exige_comprovante, curso_id } = req.body;

    if (!area || !limite_horas || !curso_id) {
      return res.status(400).json({ error: 'area, limite_horas e curso_id são obrigatórios' });
    }

    const docRef = await db.collection('regras_atividade').add({
      area,
      limite_horas,
      exige_comprovante: exige_comprovante || false,
      curso_id,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Regra criada com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/regras?curso_id=xxx - Lista regras de um curso
router.get('/', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;

    let query = db.collection('regras_atividade');

    if (curso_id) {
      query = query.where('curso_id', '==', curso_id);
    }

    const snapshot = await query.get();

    const regras = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, regras });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;