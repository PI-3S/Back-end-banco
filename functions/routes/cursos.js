const express = require('express');
const router = express.Router();
// Correção técnica: Importando a instância 'db' pronta do seu config
const { db } = require('../config/firebase'); 
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

// REMOVIDO: const db = admin.firestore(); (O db já vem pronto do require acima)

// POST /api/cursos - Só Super Admin cria
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { nome, carga_horaria_minima } = req.body;

    const docRef = await db.collection('cursos').add({
      nome,
      carga_horaria_minima,
      criado_por_admin_id: req.usuario.uid,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'curso_criado', { curso_id: docRef.id, nome });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Curso criado com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/cursos - Todos podem ver
router.get('/', verificarToken, async (req, res) => {
  try {
    const snapshot = await db.collection('cursos').get();

    const cursos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, cursos });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;