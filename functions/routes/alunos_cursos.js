const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const { registrarLog } = require('../services/logs');

const db = admin.firestore();

// POST /api/alunos-cursos - Coordenador vincula aluno ao curso
router.post('/', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    const { usuario_id, curso_id } = req.body;

    if (!usuario_id || !curso_id) {
      return res.status(400).json({ error: 'usuario_id e curso_id são obrigatórios' });
    }

    // Verifica se aluno existe e tem perfil correto
    const usuarioDoc = await db.collection('usuarios').doc(usuario_id).get();
    if (!usuarioDoc.exists || usuarioDoc.data().perfil !== 'aluno') {
      return res.status(400).json({ error: 'Usuário não é um aluno válido' });
    }

    // Verifica se curso existe
    const cursoDoc = await db.collection('cursos').doc(curso_id).get();
    if (!cursoDoc.exists) {
      return res.status(400).json({ error: 'Curso não encontrado' });
    }

    // Verifica se vínculo já existe
    const vinculoExiste = await db.collection('alunos_cursos')
      .where('usuario_id', '==', usuario_id)
      .where('curso_id', '==', curso_id)
      .get();

    if (!vinculoExiste.empty) {
      return res.status(400).json({ error: 'Aluno já vinculado a esse curso' });
    }

    await db.collection('alunos_cursos').add({
      usuario_id,
      curso_id,
      created_at: new Date().toISOString(),
    });

    await registrarLog(req.usuario.uid, 'aluno_vinculado_curso', { usuario_id, curso_id });

    res.status(201).json({
      success: true,
      mensagem: 'Aluno vinculado ao curso com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/alunos-cursos - Lista cursos do aluno
router.get('/', verificarToken, async (req, res) => {
  try {
    const { usuario_id } = req.query;

    let query = db.collection('alunos_cursos');

    if (usuario_id) {
      query = query.where('usuario_id', '==', usuario_id);
    } else if (req.usuario.perfil === 'aluno') {
      query = query.where('usuario_id', '==', req.usuario.uid);
    }

    const snapshot = await query.get();

    const vinculos = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      const cursoDoc = await db.collection('cursos').doc(data.curso_id).get();
      return {
        id: doc.id,
        curso_id: data.curso_id,
        curso_nome: cursoDoc.data()?.nome,
        created_at: data.created_at,
      };
    }));

    res.status(200).json({ success: true, vinculos });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/alunos-cursos/:id - Remove vínculo
router.delete('/:id', verificarToken, verificarPerfil('coordenador', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection('alunos_cursos').doc(id).delete();

    res.status(200).json({
      success: true,
      mensagem: 'Vínculo removido com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;