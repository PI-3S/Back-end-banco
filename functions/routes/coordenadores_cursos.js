const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');

const db = admin.firestore();

// POST /api/coordenadores-cursos - Super Admin vincula coordenador ao curso
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { usuario_id, curso_id } = req.body;

    if (!usuario_id || !curso_id) {
      return res.status(400).json({ error: 'usuario_id e curso_id são obrigatórios' });
    }

    // Verifica se coordenador existe e tem perfil correto
    const usuarioDoc = await db.collection('usuarios').doc(usuario_id).get();
    if (!usuarioDoc.exists || usuarioDoc.data().perfil !== 'coordenador') {
      return res.status(400).json({ error: 'Usuário não é um coordenador válido' });
    }

    // Verifica se curso existe
    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    // Verifica se vínculo já existe
    const vinculoExiste = await db.collection('coordenadores_cursos')
      .where('usuario_id', '==', usuario_id)
      .where('curso_id', '==', curso_id)
      .get();

    if (!vinculoExiste.empty) {
      return res.status(400).json({ error: 'Coordenador já vinculado a esse curso' });
    }

    await db.collection('coordenadores_cursos').add({
      usuario_id,
      curso_id,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      mensagem: 'Coordenador vinculado ao curso com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/coordenadores-cursos?curso_id=xxx
router.get('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { curso_id } = req.query;

    let query = db.collection('coordenadores_cursos');

    if (curso_id) {
      query = query.where('curso_id', '==', curso_id);
    }

    const snapshot = await query.get();

    const vinculos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, vinculos });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;