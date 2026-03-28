const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verificarToken } = require('../middlewares/auth');

router.get('/stats', verificarToken, async (req, res) => {
  try {
    const usuariosSnap = await db.collection('usuarios').count().get();
    const cursosSnap = await db.collection('cursos').count().get();
    res.status(200).json({
      success: true,
      totalUsuarios: usuariosSnap.data().count,
      totalCursos: cursosSnap.data().count
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;