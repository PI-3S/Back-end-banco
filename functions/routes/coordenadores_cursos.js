const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/coordenadores-cursos
router.post('/', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { usuario_id, curso_id } = req.body;

    if (!usuario_id || !curso_id) {
      return res.status(400).json({ error: 'usuario_id e curso_id são obrigatórios' });
    }

    const usuarioDoc = await db.collection('usuarios').doc(usuario_id).get();
    if (!usuarioDoc.exists || usuarioDoc.data().perfil !== 'coordenador') {
      return res.status(400).json({ error: 'Usuário não é um coordenador válido' });
    }

    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    const vinculoExiste = await db.collection('coordenadores_cursos')
      .where('usuario_id', '==', usuario_id)
      .where('curso_id', '==', curso_id)
      .get();

    if (!vinculoExiste.empty) {
      return res.status(400).json({ error: 'Coordenador já vinculado a esse curso' });
    }

    const docRef = await db.collection('coordenadores_cursos').add({
      usuario_id,
      curso_id,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'vinculo_coordenador_criado', {
      vinculo_id: docRef.id,
      usuario_id,
      curso_id
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensagem: 'Coordenador vinculado ao curso com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/coordenadores-cursos
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

// 🆕 DELETE /api/coordenadores-cursos/:id - Remover vínculo
router.delete('/:id', verificarToken, verificarPerfil('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const vinculoRef = db.collection('coordenadores_cursos').doc(id);
    const vinculoDoc = await vinculoRef.get();

    if (!vinculoDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Vínculo não encontrado' 
      });
    }

    const vinculoData = vinculoDoc.data();

    await vinculoRef.delete();

    await registrarLog(req.usuario.uid, 'vinculo_coordenador_removido', {
      vinculo_id: id,
      usuario_id: vinculoData.usuario_id,
      curso_id: vinculoData.curso_id
    });

    res.status(200).json({
      success: true,
      mensagem: 'Vínculo removido com sucesso!',
    });

  } catch (error) {
    console.error('Erro ao remover vínculo:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;