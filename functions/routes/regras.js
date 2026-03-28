const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// POST /api/regras
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { area, limite_horas, exige_comprovante, curso_id } = req.body;

    if (!area || !limite_horas || !curso_id) {
      return res.status(400).json({ error: 'area, limite_horas e curso_id são obrigatórios' });
    }

    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    const regraDuplicada = await db.collection('regras_atividade')
      .where('curso_id', '==', curso_id)
      .where('area', '==', area)
      .get();

    if (!regraDuplicada.empty) {
      return res.status(400).json({ error: 'Já existe uma regra para essa área nesse curso' });
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

// GET /api/regras
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